const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    // One account per user
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Account must belong to a user"],
      unique: true,
    },

    balance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },

    minimumBalance: {
      type: Number,
      default: 200,
      min: [0, "Minimum balance cannot be negative"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isFrozen: {
      type: Boolean,
      default: false,
    },

    frozenReason: {
      type: String,
      default: null,
    },

    // Auto recharge feature — same as E-ZPass AutoPay
    autoRecharge: {
      isEnabled: {
        type: Boolean,
        default: false,
      },
      rechargeAmount: {
        type: Number,
        default: 500,
        min: [100, "Recharge amount must be at least 100"],
      },
      triggerAmount: {
        type: Number,
        default: 100,
      },
    },

    // Statistics — updated with every transaction
    totalTopUps: {
      type: Number,
      default: 0,
    },

    totalTopUpAmount: {
      type: Number,
      default: 0,
    },

    totalTollDeductions: {
      type: Number,
      default: 0,
    },

    totalTollAmount: {
      type: Number,
      default: 0,
    },

    lastTopUpDate: {
      type: Date,
      default: null,
    },

    lastDeductionDate: {
      type: Date,
      default: null,
    },

    // Human readable account number — Format: TMS-XXXXXXXX
    accountNumber: {
      type: String,
      unique: true,
    },
  },

  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual — checks if balance is below minimum threshold
accountSchema.virtual("isLowBalance").get(function () {
  return this.balance <= this.minimumBalance;
});



// Indexes for fast queries
accountSchema.index({ isActive: 1 });
accountSchema.index({ isFrozen: 1 });

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;