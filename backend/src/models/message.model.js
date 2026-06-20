const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────
//  message.model.js
//  Each document here is ONE message inside a
//  conversation — like one text bubble in a chat.
// ─────────────────────────────────────────────────────

const messageSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────────
    //  WHICH CONVERSATION THIS MESSAGE BELONGS TO
    // ─────────────────────────────────────────────────
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Message must belong to a conversation"],
    },

    // ─────────────────────────────────────────────────
    //  WHO SENT IT
    // ─────────────────────────────────────────────────
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message must have a sender"],
    },

    // ─────────────────────────────────────────────────
    //  WHO RECEIVES IT
    //  Even though conversation has 2 participants,
    //  storing receiver directly makes "unread count"
    //  queries much faster
    // ─────────────────────────────────────────────────
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message must have a receiver"],
    },

    // ─────────────────────────────────────────────────
    //  MESSAGE CONTENT
    // ─────────────────────────────────────────────────
    content: {
      type: String,
      required: [true, "Message content cannot be empty"],
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
    },

    // ─────────────────────────────────────────────────
    //  READ STATUS
    //  Used for "seen" / "unread" indicators
    // ─────────────────────────────────────────────────
    isRead: {
      type: Boolean,
      default: false,
    },

    readAt: {
      type: Date,
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────
//  INDEXES
//  We query messages by conversation (to load chat
//  history) and by receiver (to count unread messages)
// ─────────────────────────────────────────────────────
messageSchema.index({ conversation: 1, createdAt: 1 });
messageSchema.index({ receiver: 1, isRead: 1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;