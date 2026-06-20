const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");
const ApiResponse = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────
//  HELPER — Can these two roles message each other?
//
//  Rules:
//  user     ↔ admin, operator   (NOT other users)
//  operator ↔ admin, user        (NOT other operators)
//  admin    ↔ everyone
// ─────────────────────────────────────────────────────
const canMessage = (roleA, roleB) => {
  if (roleA === "admin" || roleB === "admin") return true;
  if (roleA === "user" && roleB === "operator") return true;
  if (roleA === "operator" && roleB === "user") return true;
  return false;
};

// ─────────────────────────────────────────────────────
//  @desc    Get list of people I can chat with
//  @route   GET /api/v1/messages/contacts
//  @access  Protected (all roles)
// ─────────────────────────────────────────────────────
const getChatContacts = async (req, res, next) => {
  try {
    let filter = {};

    // ── Build filter based on my role ──────────────────
    if (req.user.role === "admin") {
      // Admin can message everyone except themselves
      filter = { _id: { $ne: req.user._id } };
    } else if (req.user.role === "user") {
      // User can message admins and operators
      filter = { role: { $in: ["admin", "operator"] } };
    } else if (req.user.role === "operator") {
      // Operator can message admins and users
      filter = { role: { $in: ["admin", "user"] } };
    }

    const contacts = await User.find(filter)
      .select("name email role")
      .sort({ role: 1, name: 1 });

    return ApiResponse.success(res, "Contacts fetched successfully", {
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get my conversations (chat list)
//  @route   GET /api/v1/messages/conversations
//  @access  Protected (all roles)
// ─────────────────────────────────────────────────────
const getMyConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate("participants", "name email role")
      .populate("lastMessageSender", "name")
      .sort({ lastMessageAt: -1 });

    // ── Format response — show "other person" details ─
    const formatted = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id.toString() !== req.user._id.toString()
        );

        // Count unread messages from the other person
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          receiver:     req.user._id,
          isRead:       false,
        });

        return {
          conversationId: conv._id,
          otherUser: {
            id:    otherUser._id,
            name:  otherUser.name,
            email: otherUser.email,
            role:  otherUser.role,
          },
          lastMessage:   conv.lastMessage,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
        };
      })
    );

    return ApiResponse.success(res, "Conversations fetched successfully", {
      count: formatted.length,
      conversations: formatted,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get or create conversation with a user
//  @route   POST /api/v1/messages/conversations/:userId
//  @access  Protected (all roles)
// ─────────────────────────────────────────────────────
const getOrCreateConversation = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // ── Step 1: Cannot message yourself ───────────────
    if (userId === req.user._id.toString()) {
      return ApiResponse.error(res, "You cannot message yourself", 400);
    }

    // ── Step 2: Check the other user exists ───────────
    const otherUser = await User.findById(userId);

    if (!otherUser) {
      return ApiResponse.error(res, "User not found", 404);
    }

    // ── Step 3: Check role permissions ────────────────
    if (!canMessage(req.user.role, otherUser.role)) {
      return ApiResponse.error(
        res,
        `Users with role '${req.user.role}' cannot message users with role '${otherUser.role}'`,
        403
      );
    }

    // ── Step 4: Find existing conversation ────────────
    // $all checks both ids exist in participants array
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, userId] },
    }).populate("participants", "name email role");

    // ── Step 5: Create if doesn't exist ───────────────
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, userId],
      });

      await conversation.populate("participants", "name email role");
    }

    return ApiResponse.success(
      res,
      "Conversation ready",
      conversation
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get all messages in a conversation
//  @route   GET /api/v1/messages/:conversationId
//  @access  Protected (must be a participant)
// ─────────────────────────────────────────────────────
const getMessages = async (req, res, next) => {
  try {
    // ── Step 1: Verify conversation exists and user
    //    is a participant ────────────────────────────
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return ApiResponse.error(res, "Conversation not found", 404);
    }

    const isParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(req.user._id.toString());

    if (!isParticipant) {
      return ApiResponse.error(
        res,
        "Access denied. You are not part of this conversation.",
        403
      );
    }

    // ── Step 2: Pagination — load most recent first ────
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip  = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ conversation: req.params.conversationId })
        .populate("sender", "name role")
        .sort({ createdAt: -1 }) // newest first
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversation: req.params.conversationId }),
    ]);

    // ── Step 3: Reverse so oldest is first (chat order) ─
    const orderedMessages = messages.reverse();

    return ApiResponse.success(res, "Messages fetched successfully", {
      conversationId: req.params.conversationId,
      count:          orderedMessages.length,
      total,
      page,
      messages:       orderedMessages,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Send a message (REST API fallback)
//  @route   POST /api/v1/messages/:conversationId
//  @access  Protected (must be a participant)
//
//  Note: In real-time, Socket.IO handles sending
//  messages instantly. This REST route is a fallback
//  for when sockets are unavailable, and is also
//  what the socket handler internally calls.
// ─────────────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return ApiResponse.error(res, "Message content cannot be empty", 400);
    }

    // ── Step 1: Verify conversation and participant ────
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return ApiResponse.error(res, "Conversation not found", 404);
    }

    const isParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(req.user._id.toString());

    if (!isParticipant) {
      return ApiResponse.error(
        res,
        "Access denied. You are not part of this conversation.",
        403
      );
    }

    // ── Step 2: Find receiver (the other participant) ──
    const receiverId = conversation.participants.find(
      (p) => p.toString() !== req.user._id.toString()
    );

    // ── Step 3: Create message ─────────────────────────
    const message = await Message.create({
      conversation: conversation._id,
      sender:       req.user._id,
      receiver:     receiverId,
      content:      content.trim(),
    });

    await message.populate("sender", "name role");

    // ── Step 4: Update conversation preview ────────────
    conversation.lastMessage       = content.trim();
    conversation.lastMessageAt     = new Date();
    conversation.lastMessageSender = req.user._id;
    await conversation.save();

    return ApiResponse.success(res, "Message sent successfully", message, 201);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Mark all messages in a conversation as read
//  @route   PUT /api/v1/messages/:conversationId/read
//  @access  Protected (must be a participant)
// ─────────────────────────────────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
      return ApiResponse.error(res, "Conversation not found", 404);
    }

    const isParticipant = conversation.participants
      .map((p) => p.toString())
      .includes(req.user._id.toString());

    if (!isParticipant) {
      return ApiResponse.error(
        res,
        "Access denied. You are not part of this conversation.",
        403
      );
    }

    // ── Mark all unread messages addressed to me as read ─
    const result = await Message.updateMany(
      {
        conversation: req.params.conversationId,
        receiver:     req.user._id,
        isRead:       false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return ApiResponse.success(res, "Messages marked as read", {
      markedCount: result.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get total unread message count
//  @route   GET /api/v1/messages/unread-count
//  @access  Protected (all roles)
//
//  Used for the notification badge — like the red
//  number on Messenger's icon
// ─────────────────────────────────────────────────────
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Message.countDocuments({
      receiver: req.user._id,
      isRead:   false,
    });

    return ApiResponse.success(res, "Unread count fetched successfully", {
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getChatContacts,
  canMessage, // exported so socket handler can reuse it
};