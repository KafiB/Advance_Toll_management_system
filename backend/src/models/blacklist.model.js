const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema(
  {
    // ─────────────────────────────────────────────────
    //  VEHICLE REFERENCE
    //  The vehicle that is blacklisted
    // ─────────────────────────────────────────────────
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle is required"],
    },

    // ─────────────────────────────────────────────────
    //  OWNER REFERENCE
    //  The user who owns the blacklisted vehicle
    // ─────────────────────────────────────────────────
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },

    // ─────────────────────────────────────────────────
    //  BLACKLIST REASON
    //  unpaid_tolls     → vehicle has unpaid toll dues
    //  fraud            → fraudulent activity detected
    //  stolen           → vehicle reported stolen
    //  document_expired → registration or insurance expired
    //  other            → any other reason
    // ─────────────────────────────────────────────────
    reason: {
      type: String,
      required: [true, "Blacklist reason is required"],
      enum: {
        values: [
          "unpaid_tolls",
          "fraud",
          "stolen",
          "document_expired",
          "other",
        ],
        message: "Invalid blacklist reason",
      },
    },

    // Detailed description of why vehicle was blacklisted
    description: {
      type: String,
      required: [true, "Please provide a description"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // ─────────────────────────────────────────────────
    //  FINANCIAL DETAILS
    //  Tracks unpaid toll amount if reason is unpaid_tolls
    // ─────────────────────────────────────────────────
    unpaidAmount: {
      type: Number,
      default: 0,
      min: [0, "Unpaid amount cannot be negative"],
    },

    // ─────────────────────────────────────────────────
    //  STATUS
    //  active   → vehicle is currently blacklisted
    //  resolved → blacklist has been lifted
    // ─────────────────────────────────────────────────
    status: {
    type: String,
    enum: {
    values: ["active", "resolved", "pending_review"],
    message: "Status must be active, resolved, or pending_review",
      },
      default: "active",
    }, 
    // ─────────────────────────────────────────────────
    //  WHO BLACKLISTED
    //  Admin who created this blacklist record
    // ─────────────────────────────────────────────────
    blacklistedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Blacklisted by is required"],
    },

    // ─────────────────────────────────────────────────
    //  RESOLUTION DETAILS
    //  Filled when blacklist is lifted
    // ─────────────────────────────────────────────────
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    resolutionNotes: {
      type: String,
      default: null,
      trim: true,
    },

    // ─────────────────────────────────────────────────
    //  SNAPSHOTS
    //  We store key details at time of blacklisting
    //  So records remain accurate even if vehicle
    //  details change later
    // ─────────────────────────────────────────────────
    vehicleSnapshot: {
      licensePlate: { type: String, default: null },
      make:         { type: String, default: null },
      model:        { type: String, default: null },
      vehicleType:  { type: String, default: null },
    },

    ownerSnapshot: {
      name:  { type: String, default: null },
      email: { type: String, default: null },
      phone: { type: String, default: null },
    },
  },

  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─────────────────────────────────────────────────────
//  VIRTUAL FIELD
//  isActive — checks if blacklist is still active
// ─────────────────────────────────────────────────────
blacklistSchema.virtual("isActive").get(function () {
  return this.status === "active";
});

// ─────────────────────────────────────────────────────
//  INDEXES
// ─────────────────────────────────────────────────────
blacklistSchema.index({ vehicle: 1 });
blacklistSchema.index({ owner: 1 });
blacklistSchema.index({ status: 1 });
blacklistSchema.index({ reason: 1 });
blacklistSchema.index({ createdAt: -1 });

const Blacklist = mongoose.model("Blacklist", blacklistSchema);

module.exports = Blacklist;