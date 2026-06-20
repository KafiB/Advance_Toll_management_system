const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────
//  user.model.js
//  Defines the structure of a User in our database.
//
//  Think of this like a FORM — every user that registers
//  must fill this exact form. If any required field is
//  missing, MongoDB rejects it automatically.
//
//  Roles in our system:
//  - "admin"    → full access, manages everything
//  - "operator" → manages toll booths and transactions
//  - "user"     → vehicle owner, pays tolls
// ─────────────────────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────────
    //  BASIC INFO
    // ─────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,           // removes extra spaces
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,         // no two users can have same email
      lowercase: true,      // always stored as lowercase
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      trim: true,
      match: [
        /^[+]?[\d\s\-().]{7,15}$/,
        "Please provide a valid phone number",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      // select: false means password will NEVER be
      // returned in any query unless we explicitly ask
      // This is how Google/Facebook protect passwords
      select: false,
    },

    // ─────────────────────────────────────────────────
    //  ROLE & STATUS
    // ─────────────────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ["admin", "operator", "user"],
        message: "Role must be admin, operator, or user",
      },
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: true,        // account is active by default
    },

    isEmailVerified: {
      type: Boolean,
      default: false,       // email not verified until confirmed
    },

    // ─────────────────────────────────────────────────
    //  PASSWORD RESET
    //  These fields are used in forgot password flow
    //  We store hashed token — never plain token
    // ─────────────────────────────────────────────────
    passwordResetToken: {
      type: String,
      select: false,        // never returned in queries
    },

    passwordResetExpire: {
      type: Date,
      select: false,
    },

    // ─────────────────────────────────────────────────
    //  EMAIL VERIFICATION
    //  Token sent to email when user registers
    // ─────────────────────────────────────────────────
    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpire: {
      type: Date,
      select: false,
    },

    // ─────────────────────────────────────────────────
    //  SECURITY TRACKING
    //  Tracks login attempts to prevent brute force
    //  Same technique used by Google and Microsoft
    // ─────────────────────────────────────────────────
    loginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: {
      type: Date,
      default: null,        // null means account is not locked
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    // ─────────────────────────────────────────────────
    //  PROFILE
    // ─────────────────────────────────────────────────
    avatar: {
      type: String,
      default: null,        // profile picture URL
    },

    address: {
      street: { type: String, trim: true },
      city:   { type: String, trim: true },
      state:  { type: String, trim: true },
      zip:    { type: String, trim: true },
    },
  },

  {
    // ─────────────────────────────────────────────────
    //  Schema Options
    //  timestamps: true → auto adds createdAt, updatedAt
    //  toJSON/toObject  → includes virtual fields
    // ─────────────────────────────────────────────────
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────────────
//  VIRTUAL FIELD
//  isLocked — checks if account is currently locked
//  Virtual fields are NOT stored in DB
//  They are calculated on the fly when accessed
//
//  Usage: user.isLocked → true or false
// ─────────────────────────────────────────────────────
userSchema.virtual("isLocked").get(function () {
  // If lockUntil exists and is in the future → locked
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// ─────────────────────────────────────────────────────
//  INDEXES
//  Indexes make database queries faster
//  Without indexes, MongoDB scans every document
//  With indexes, it jumps directly to the result
//  Same technique used by every large scale system
// ─────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

const User = mongoose.model("User", userSchema);

module.exports = User;