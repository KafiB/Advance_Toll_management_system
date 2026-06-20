const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const { canMessage } = require("../controllers/messageController");

// ─────────────────────────────────────────────────────
//  socketHandler.js
//  This file handles all real-time chat events.
//
//  How it works (in plain English):
//  1. When a user opens the app, frontend connects to
//     socket and sends their JWT token
//  2. We verify the token — same way as authMiddleware
//  3. We remember "this socket belongs to this user"
//  4. When user sends a message, we save it to MongoDB
//     AND instantly push it to the receiver if they
//     are online
//  5. We also track who is online/offline
// ─────────────────────────────────────────────────────

// ── In-memory map: userId -> socketId ─────────────────
// Tracks which socket connection belongs to which user
// Example: { "6a2beef6...": "socketAbc123" }
const onlineUsers = new Map();

const initializeSocket = (io) => {
  // ───────────────────────────────────────────────────
  //  MIDDLEWARE — runs before connection is accepted
  //  Verifies the JWT token sent by frontend
  // ───────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return next(new Error("User not found"));
      }

      if (!user.isActive) {
        return next(new Error("Account is deactivated"));
      }

      // Attach user info to this socket connection
      // Now every event handler below can use socket.user
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Invalid or expired token"));
    }
  });

  // ───────────────────────────────────────────────────
  //  CONNECTION — runs when a user connects
  // ───────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const userId = socket.user._id.toString();

    console.log(`🟢 User connected: ${socket.user.name} (${socket.user.role})`);

    // ── Remember this user is online ───────────────────
    onlineUsers.set(userId, socket.id);

    // ── Tell everyone this user is now online ──────────
    io.emit("user_online", { userId });

    // ─────────────────────────────────────────────────
    //  EVENT: send_message
    //  Frontend emits this when user sends a message
    //
    //  Payload: { conversationId, content }
    // ─────────────────────────────────────────────────
    socket.on("send_message", async (data, callback) => {
      try {
        const { conversationId, content } = data;

        if (!content || !content.trim()) {
          return callback?.({ success: false, message: "Message cannot be empty" });
        }

        // ── Verify conversation and participant ────────
        const conversation = await Conversation.findById(conversationId);

        if (!conversation) {
          return callback?.({ success: false, message: "Conversation not found" });
        }

        const isParticipant = conversation.participants
          .map((p) => p.toString())
          .includes(userId);

        if (!isParticipant) {
          return callback?.({ success: false, message: "Access denied" });
        }

        // ── Find receiver ───────────────────────────────
        const receiverId = conversation.participants
          .find((p) => p.toString() !== userId)
          .toString();

        // ── Save message to database ────────────────────
        const message = await Message.create({
          conversation: conversationId,
          sender:       userId,
          receiver:     receiverId,
          content:      content.trim(),
        });

        await message.populate("sender", "name role");

        // ── Update conversation preview ─────────────────
        conversation.lastMessage       = content.trim();
        conversation.lastMessageAt     = new Date();
        conversation.lastMessageSender = userId;
        await conversation.save();

        // ── Send to receiver IF they are online ─────────
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_message", {
            conversationId,
            message,
          });
        }

        // ── Confirm to sender — message was saved ───────
        callback?.({ success: true, message });
      } catch (error) {
        console.error("send_message error:", error.message);
        callback?.({ success: false, message: "Failed to send message" });
      }
    });

    // ─────────────────────────────────────────────────
    //  EVENT: typing
    //  Shows "User is typing..." indicator
    //
    //  Payload: { conversationId, receiverId }
    // ─────────────────────────────────────────────────
    socket.on("typing", (data) => {
      const { receiverId, conversationId } = data;
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_typing", {
          conversationId,
          userId,
        });
      }
    });

    // ─────────────────────────────────────────────────
    //  EVENT: stop_typing
    // ─────────────────────────────────────────────────
    socket.on("stop_typing", (data) => {
      const { receiverId, conversationId } = data;
      const receiverSocketId = onlineUsers.get(receiverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("user_stop_typing", {
          conversationId,
          userId,
        });
      }
    });

    // ─────────────────────────────────────────────────
    //  EVENT: mark_read
    //  Frontend emits this when user opens a conversation
    //
    //  Payload: { conversationId }
    // ─────────────────────────────────────────────────
    socket.on("mark_read", async (data) => {
      try {
        const { conversationId } = data;

        await Message.updateMany(
          {
            conversation: conversationId,
            receiver:     userId,
            isRead:       false,
          },
          {
            isRead: true,
            readAt: new Date(),
          }
        );

        // ── Tell the sender their messages were seen ────
        const conversation = await Conversation.findById(conversationId);
        const otherUserId = conversation.participants
          .find((p) => p.toString() !== userId)
          .toString();

        const otherSocketId = onlineUsers.get(otherUserId);
        if (otherSocketId) {
          io.to(otherSocketId).emit("messages_seen", { conversationId });
        }
      } catch (error) {
        console.error("mark_read error:", error.message);
      }
    });

    // ─────────────────────────────────────────────────
    //  DISCONNECT — runs when user closes the app/tab
    // ─────────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🔴 User disconnected: ${socket.user.name}`);
      onlineUsers.delete(userId);

      // ── Tell everyone this user went offline ──────────
      io.emit("user_offline", { userId });
    });
  });
};

module.exports = initializeSocket;