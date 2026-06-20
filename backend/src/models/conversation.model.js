const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────
//  conversation.model.js
//  A "conversation" is a chat thread between two people.
//
//  Think of it like opening a chat with someone on
//  Messenger — that chat thread is a "conversation".
//  Each conversation has exactly 2 participants.
//
//  We track the last message so we can show chat
//  previews like "Hey, are you there? - 2 min ago"
// ─────────────────────────────────────────────────────

const conversationSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────────
    //  PARTICIPANTS
    //  Always exactly 2 users in a conversation
    //  Example: [userId, adminId]
    // ─────────────────────────────────────────────────
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      validate: {
        validator: function (val) {
          return val.length === 2;
        },
        message: "A conversation must have exactly 2 participants",
      },
      required: true,
    },

    // ─────────────────────────────────────────────────
    //  LAST MESSAGE PREVIEW
    //  Shown in the chat list — like "Hey, are you there?"
    //  Updated every time a new message is sent
    // ─────────────────────────────────────────────────
    lastMessage: {
      type: String,
      default: null,
    },

    lastMessageAt: {
      type: Date,
      default: null,
    },

    lastMessageSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },

  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────
//  INDEX
//  We search conversations by participants very often
//  Example: "find the conversation between user A and B"
// ─────────────────────────────────────────────────────
conversationSchema.index({ participants: 1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;