const Account = require("../models/account.model");
const Transaction = require("../models/transaction.model");
const Vehicle = require("../models/vehicle.model");
const Blacklist = require("../models/blacklist.model");
const { sendLowBalanceEmail } = require("./emailService");

// ─────────────────────────────────────────────────────
//  tollService.js
//  Contains reusable business logic that runs
//  automatically — not triggered directly by routes.
//
//  These functions are called FROM the transaction
//  controller after a toll is processed.
// ─────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────
//  generateTransactionRef
//  Same helper used in transactionController
//  Kept here too so this service is self-contained
// ─────────────────────────────────────────────────────
const generateTransactionRef = () => {
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `TXN-${randomDigits}`;
};

// ─────────────────────────────────────────────────────
//  processAutoRecharge
//  Checks if account balance fell below the trigger
//  amount. If auto-recharge is enabled, automatically
//  tops up the account and creates a topup transaction.
//
//  Same feature as E-ZPass AutoPay — your balance
//  never runs out unexpectedly.
//
//  @param {Object} account - Mongoose Account document
//  @returns {Object|null} - recharge details or null
// ─────────────────────────────────────────────────────
const processAutoRecharge = async (account) => {
  try {
    // ── Step 1: Check if auto-recharge is enabled ─────
    if (!account.autoRecharge || !account.autoRecharge.isEnabled) {
      return null;
    }

    // ── Step 2: Check if balance is below trigger ─────
    if (account.balance > account.autoRecharge.triggerAmount) {
      return null; // balance is fine, nothing to do
    }

    // ── Step 3: Perform the recharge ──────────────────
    const rechargeAmount = account.autoRecharge.rechargeAmount;
    const balanceBefore  = account.balance;

    account.balance          += rechargeAmount;
    account.totalTopUps      += 1;
    account.totalTopUpAmount += rechargeAmount;
    account.lastTopUpDate    = new Date();
    await account.save();

    // ── Step 4: Create transaction record for the recharge
    const transaction = await Transaction.create({
      transactionRef: generateTransactionRef(),
      type:           "topup",
      status:         "success",
      user:           account.owner,
      amount:         rechargeAmount,
      balanceBefore,
      balanceAfter:   account.balance,
      description:    "Auto-recharge triggered — balance was below threshold",
    });

    return {
      transactionRef: transaction.transactionRef,
      rechargeAmount,
      balanceBefore,
      balanceAfter:   account.balance,
    };
  } catch (error) {
    // Auto-recharge failure should never crash the toll
    // transaction — just log it
    console.error("Auto-recharge failed:", error.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────
//  checkAndFlagVehicle
//  Checks how many "insufficient balance" failures a
//  vehicle has had recently. If it crosses the
//  threshold, creates a "pending review" blacklist
//  record automatically.
//
//  This does NOT block the vehicle immediately —
//  it flags it for an admin to review and decide.
//
//  @param {ObjectId} vehicleId
//  @returns {Object|null} - flag details or null
// ─────────────────────────────────────────────────────
const FAILURE_THRESHOLD   = 3;                     // 3 failures triggers flag
const FAILURE_WINDOW_MS   = 24 * 60 * 60 * 1000;  // within 24 hours

const checkAndFlagVehicle = async (vehicleId) => {
  try {
    // ── Step 1: Check if vehicle already has an active
    //    or pending blacklist record ────────────────────
    const existingRecord = await Blacklist.findOne({
      vehicle: vehicleId,
      status:  { $in: ["active", "pending_review"] },
    });

    if (existingRecord) {
      return null; // already flagged, nothing to do
    }

    // ── Step 2: Count recent insufficient balance failures
    const since = new Date(Date.now() - FAILURE_WINDOW_MS);

    const failureCount = await Transaction.countDocuments({
      vehicle:       vehicleId,
      type:          "toll",
      status:        "failed",
      failureReason: "Insufficient balance",
      createdAt:     { $gte: since },
    });

    if (failureCount < FAILURE_THRESHOLD) {
      return null; // below threshold, no action needed
    }

    // ── Step 3: Get vehicle and owner details ──────────
    const vehicle = await Vehicle.findById(vehicleId).populate(
      "owner",
      "name email phone"
    );

    if (!vehicle) return null;

    // ── Step 4: Create pending review blacklist record ─
    // Admin must review and decide whether to fully
    // blacklist or dismiss this flag
    const flagRecord = await Blacklist.create({
      vehicle:      vehicle._id,
      owner:        vehicle.owner._id,
      reason:       "unpaid_tolls",
      description:  `Auto-flagged: ${failureCount} failed toll attempts due to insufficient balance within 24 hours`,
      status:       "pending_review",
      blacklistedBy: vehicle.owner._id, // system action — using owner as placeholder
      vehicleSnapshot: {
        licensePlate: vehicle.licensePlate,
        make:         vehicle.make,
        model:        vehicle.model,
        vehicleType:  vehicle.vehicleType,
      },
      ownerSnapshot: {
        name:  vehicle.owner.name,
        email: vehicle.owner.email,
        phone: vehicle.owner.phone,
      },
    });

    return {
      flagged: true,
      failureCount,
      recordId: flagRecord._id,
    };
  } catch (error) {
    console.error("Auto-flag check failed:", error.message);
    return null;
  }
};

// ─────────────────────────────────────────────────────
//  calculateToll
//  Calculates the final toll amount for a vehicle
//  at a booth, applying any applicable discounts.
//
//  Discount rules:
//  - Frequent traveler: 10% off if vehicle has
//    50+ total trips
//
//  @param {Object} booth - Mongoose Booth document
//  @param {Object} vehicle - Mongoose Vehicle document
//  @returns {Object} - { baseRate, discount, finalAmount }
// ─────────────────────────────────────────────────────
const FREQUENT_TRAVELER_THRESHOLD = 50;  // trips
const FREQUENT_TRAVELER_DISCOUNT  = 0.10; // 10%

const calculateToll = (booth, vehicle) => {
  const baseRate = booth.tollRates[vehicle.vehicleType] || 0;

  let discount    = 0;
  let discountReason = null;

  if (vehicle.totalTrips >= FREQUENT_TRAVELER_THRESHOLD) {
    discount       = Math.round(baseRate * FREQUENT_TRAVELER_DISCOUNT * 100) / 100;
    discountReason = "Frequent traveler discount (10%)";
  }

  const finalAmount = Math.round((baseRate - discount) * 100) / 100;

  return {
    baseRate,
    discount,
    discountReason,
    finalAmount,
  };
};

module.exports = {
  processAutoRecharge,
  checkAndFlagVehicle,
  calculateToll,
  generateTransactionRef,
};