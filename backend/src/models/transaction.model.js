const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    // Unique reference number — generated in controller
    // Format: TXN-XXXXXXXX
    transactionRef: {
      type: String,
      unique: true,
      trim: true,
    },

    // toll, topup, refund, adjustment
    type: {
      type: String,
      required: [true, "Transaction type is required"],
      enum: {
        values: ["toll", "topup", "refund", "adjustment"],
        message: "Type must be toll, topup, refund, or adjustment",
      },
    },

    // success, failed, pending
    status: {
      type: String,
      enum: {
        values: ["success", "failed", "pending"],
        message: "Status must be success, failed, or pending",
      },
      default: "success",
    },

    // User who owns this transaction
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Transaction must belong to a user"],
    },

    // Vehicle that passed through — only for toll
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      default: null,
    },

    // Booth where transaction happened — only for toll
    booth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booth",
      default: null,
    },

    // Operator who processed it — only for toll
    operator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Financial details
    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [0, "Amount cannot be negative"],
    },

    // Balance before this transaction
    balanceBefore: {
      type: Number,
      required: [true, "Balance before is required"],
      min: [0, "Balance cannot be negative"],
    },

    // Balance after this transaction
    balanceAfter: {
      type: Number,
      required: [true, "Balance after is required"],
      min: [0, "Balance cannot be negative"],
    },

    // Toll specific details — snapshot at time of transaction
    // We store these as strings so even if vehicle/booth
    // is deleted later, the record stays intact
    tollDetails: {
      vehicleType:  { type: String, default: null },
      licensePlate: { type: String, default: null },
      rfidTag:      { type: String, default: null },
      boothCode:    { type: String, default: null },
      boothName:    { type: String, default: null },
      tollRate:     { type: Number, default: null },
    },

    // Why transaction failed — only filled on failure
    failureReason: {
      type: String,
      default: null,
    },

    // Extra description
    description: {
      type: String,
      trim: true,
      default: null,
    },

    // IP address for fraud detection
    ipAddress: {
      type: String,
      default: null,
    },
  },

  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for fast queries
transactionSchema.index({ user: 1 });
transactionSchema.index({ vehicle: 1 });
transactionSchema.index({ booth: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ transactionRef: 1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;