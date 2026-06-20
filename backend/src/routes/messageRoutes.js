const express = require("express");
const router = express.Router();

const {
  getMyConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  getChatContacts,
} = require("../controllers/messageController");

const { protect } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────────────
//  MESSAGE ROUTES
//  Base URL: /api/v1/messages
//
//  Any logged in user (user, operator, admin) can use
//  these routes. Permission rules for WHO can message
//  WHOM are handled inside the controller.
// ─────────────────────────────────────────────────────

// GET /api/v1/messages/contacts
// Get list of people this user is allowed to chat with
// user     → can message admin and operators
// operator → can message admin and users
// admin    → can message everyone
router.get("/contacts", protect, getChatContacts);

// GET /api/v1/messages/conversations
// Get all conversations for logged in user
// Shows chat list with last message preview
router.get("/conversations", protect, getMyConversations);

// GET /api/v1/messages/unread-count
// Get total unread message count — for notification badge
router.get("/unread-count", protect, getUnreadCount);

// POST /api/v1/messages/conversations/:userId
// Get existing conversation with a user, or create new one
// :userId is the OTHER person's user id
router.post(
  "/conversations/:userId",
  protect,
  getOrCreateConversation
);

// GET /api/v1/messages/:conversationId
// Get all messages in a conversation (chat history)
router.get("/:conversationId", protect, getMessages);

// POST /api/v1/messages/:conversationId
// Send a message in a conversation
// Also used as fallback if Socket.IO is disconnected
router.post("/:conversationId", protect, sendMessage);

// PUT /api/v1/messages/:conversationId/read
// Mark all messages in a conversation as read
router.put("/:conversationId/read", protect, markAsRead);

module.exports = router;