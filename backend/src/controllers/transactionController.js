const Transaction = require("../models/transaction.model");
const Vehicle = require("../models/vehicle.model");
const Account = require("../models/account.model");
const Booth = require("../models/booth.model");
const User = require("../models/user.model");
const ApiResponse = require("../utils/apiResponse");
const { processAutoRecharge, checkAndFlagVehicle, calculateToll } = require("../services/tollService");
// ─────────────────────────────────────────────────────
//  HELPER — Generate transaction reference number
//  Format: TXN-XXXXXXXX
//  Called inside controller instead of pre-save hook
// ─────────────────────────────────────────────────────
const generateTransactionRef = () => {
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  return `TXN-${randomDigits}`;
};

// ─────────────────────────────────────────────────────
//  @desc    Process a toll transaction
//  @route   POST /api/v1/transactions/process-toll
//  @access  Protected (admin, operator)
//
//  This is the CORE of the entire toll system.
//  This function runs every time a vehicle passes
//  through a toll booth. It must be fast, accurate,
//  and handle all edge cases gracefully.
//
//  Flow:
//  1. Find vehicle by RFID tag or license plate
//  2. Find vehicle owner's account
//  3. Check all validations
//  4. Deduct toll amount from account
//  5. Create transaction record
//  6. Update booth and vehicle statistics
//  7. Send low balance alert if needed
// ─────────────────────────────────────────────────────
const processToll = async (req, res, next) => {
  try {
    const { rfidTag, licensePlate, boothId } = req.body;

    // ── Step 1: Validate input ────────────────────────
    if (!boothId) {
      return ApiResponse.error(res, "Please provide a booth ID", 400);
    }

    if (!rfidTag && !licensePlate) {
      return ApiResponse.error(
        res,
        "Please provide either RFID tag or license plate",
        400
      );
    }

    // ── Step 2: Find the booth ─────────────────────────
    const booth = await Booth.findById(boothId);

    if (!booth) {
      return ApiResponse.error(res, "Booth not found", 404);
    }

    if (!booth.isActive) {
      return ApiResponse.error(res, "This booth is not active", 400);
    }

    if (booth.status !== "operational") {
      return ApiResponse.error(
        res,
        `Booth is currently ${booth.status}. Cannot process toll.`,
        400
      );
    }

    // ── Step 3: Find vehicle ───────────────────────────
    // Search by RFID first, then by license plate
    const vehicleQuery = rfidTag
      ? { rfidTag }
      : { licensePlate: licensePlate.toUpperCase() };

    const vehicle = await Vehicle.findOne(vehicleQuery).populate(
      "owner",
      "name email phone"
    );

    if (!vehicle) {
      // Record failed transaction even when vehicle not found
      await Transaction.create({
        transactionRef: generateTransactionRef(),
        type:           "toll",
        status:         "failed",
        user:           req.user._id,
        booth:          boothId,
        operator:       req.user._id,
        amount:         0,
        balanceBefore:  0,
        balanceAfter:   0,
        failureReason:  "Vehicle not found in system",
        tollDetails: {
          rfidTag:      rfidTag      || null,
          licensePlate: licensePlate || null,
          boothCode:    booth.boothCode,
          boothName:    booth.name,
        },
        ipAddress: req.ip,
      });

      return ApiResponse.error(
        res,
        "Vehicle not found in system",
        404
      );
    }

    // ── Step 4: Check vehicle status ───────────────────
    if (!vehicle.isActive) {
      return ApiResponse.error(res, "Vehicle is not active", 400);
    }

    if (vehicle.isBlacklisted) {
      return ApiResponse.error(
        res,
        `Vehicle is blacklisted. Reason: ${vehicle.blacklistReason}`,
        403
      );
    }

    // ── Step 5: Get toll rate for this vehicle type ────
    // ── Step 5: Calculate toll with discounts ─────────
  const { baseRate, discount, discountReason, finalAmount } = calculateToll(booth, vehicle);

  if (!baseRate && baseRate !== 0) {
  return ApiResponse.error(
    res,
    `No toll rate defined for vehicle type: ${vehicle.vehicleType}`,
    400
  );
  }

  const tollRate = finalAmount;
  
    // ── Step 6: Find vehicle owner's account ──────────
    const account = await Account.findOne({
      owner: vehicle.owner._id,
    });

    if (!account) {
      return ApiResponse.error(
        res,
        "Vehicle owner does not have an account. Please create one first.",
        404
      );
    }

    if (!account.isActive) {
      return ApiResponse.error(res, "Vehicle owner account is not active", 400);
    }

    if (account.isFrozen) {
      return ApiResponse.error(
        res,
        "Vehicle owner account is frozen. Cannot process toll.",
        403
      );
    }

    // ── Step 7: Check sufficient balance ──────────────
    if (account.balance < tollRate) {
  // Record failed transaction
  await Transaction.create({
    transactionRef: generateTransactionRef(),
    type:           "toll",
    status:         "failed",
    user:           vehicle.owner._id,
    vehicle:        vehicle._id,
    booth:          boothId,
    operator:       req.user._id,
    amount:         tollRate,
    balanceBefore:  account.balance,
    balanceAfter:   account.balance,
    failureReason:  "Insufficient balance",
    tollDetails: {
      vehicleType:  vehicle.vehicleType,
      licensePlate: vehicle.licensePlate,
      rfidTag:      vehicle.rfidTag      || null,
      boothCode:    booth.boothCode,
      boothName:    booth.name,
      tollRate,
    },
    ipAddress: req.ip,
  });

  // ── Check if this vehicle should be auto-flagged ──
  // Runs in background — does not block response
  checkAndFlagVehicle(vehicle._id).catch((err) =>
    console.error("Auto-flag check failed:", err)
  );

  return ApiResponse.error(
    res,
    `Insufficient balance. Required: ${tollRate} BDT. Available: ${account.balance} BDT.`,
    400
  );
}

    // ── Step 8: Deduct toll from account ──────────────
    // ── Step 8: Deduct toll from account ──────────────
  const balanceBefore       = account.balance;
  account.balance           -= tollRate;
  account.totalTollDeductions += 1;
  account.totalTollAmount   += tollRate;
  account.lastDeductionDate = new Date();
  await account.save();

  // ── Step 8b: Check and process auto-recharge ──────
  // If balance fell below trigger amount and auto-recharge
  // is enabled, this tops up the account automatically
  const autoRechargeResult = await processAutoRecharge(account);
    // ── Step 9: Create success transaction record ─────
    const transaction = await Transaction.create({
      transactionRef: generateTransactionRef(),
      type:           "toll",
      status:         "success",
      user:           vehicle.owner._id,
      vehicle:        vehicle._id,
      booth:          boothId,
      operator:       req.user._id,
      amount:         tollRate,
      balanceBefore,
      balanceAfter:   account.balance,
      description:    `Toll charge for ${vehicle.vehicleType} at ${booth.name}`,
      tollDetails: {
        vehicleType:  vehicle.vehicleType,
        licensePlate: vehicle.licensePlate,
        rfidTag:      vehicle.rfidTag || null,
        boothCode:    booth.boothCode,
        boothName:    booth.name,
        tollRate,
      },
      ipAddress: req.ip,
    });

    // ── Step 10: Update booth statistics ──────────────
    // Run in background — does not block response
    Booth.findByIdAndUpdate(boothId, {
      $inc: {
        totalTransactions: 1,
        totalRevenue:      tollRate,
        todayTransactions: 1,
        todayRevenue:      tollRate,
      },
      lastTransactionDate: new Date(),
    }).catch((err) => console.error("Booth stats update failed:", err));

    // ── Step 11: Update vehicle statistics ────────────
    Vehicle.findByIdAndUpdate(vehicle._id, {
      $inc: { totalTrips: 1, totalTollPaid: tollRate },
      lastTollDate: new Date(),
    }).catch((err) => console.error("Vehicle stats update failed:", err));

    // ── Step 12: Send low balance alert if needed ─────
    // Runs in background — does not block response
    if (account.balance <= account.minimumBalance) {
      sendLowBalanceEmail(
        vehicle.owner.email,
        vehicle.owner.name,
        account.balance,
        account.minimumBalance
      ).catch((err) => console.error("Low balance email failed:", err));
    }

    // ── Step 13: Return success response ──────────────
    // ── Step 13: Return success response ──────────────
return ApiResponse.success(
  res,
  "Toll processed successfully",
  {
    transactionRef:  transaction.transactionRef,
    amount:          tollRate,
    baseRate,
    discount,
    discountReason,
    balanceBefore,
    balanceAfter:    account.balance,
    isLowBalance:    account.balance <= account.minimumBalance,
    autoRecharge:    autoRechargeResult,
    vehicle: {
      licensePlate: vehicle.licensePlate,
      vehicleType:  vehicle.vehicleType,
      owner:        vehicle.owner.name,
    },
    booth: {
      name:      booth.name,
      boothCode: booth.boothCode,
    },
  },
  201
);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get logged in user's transactions
//  @route   GET /api/v1/transactions/my-transactions
//  @access  Protected (user)
// ─────────────────────────────────────────────────────
const getMyTransactions = async (req, res, next) => {
  try {
    // ── Build filter ──────────────────────────────────
    const filter = { user: req.user._id };

    if (req.query.type)   filter.type   = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    // ── Date range filter ─────────────────────────────
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    // ── Pagination ────────────────────────────────────
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("vehicle", "licensePlate vehicleType")
        .populate("booth",   "name boothCode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      res,
      "Transactions fetched successfully",
      transactions,
      transactions.length,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get transaction by reference number
//  @route   GET /api/v1/transactions/:ref
//  @access  Protected
// ─────────────────────────────────────────────────────
const getTransactionByRef = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      transactionRef: req.params.ref,
    })
      .populate("user",     "name email phone")
      .populate("vehicle",  "licensePlate vehicleType make model")
      .populate("booth",    "name boothCode location")
      .populate("operator", "name email");

    if (!transaction) {
      return ApiResponse.error(res, "Transaction not found", 404);
    }

    // ── Check ownership ───────────────────────────────
    // User can only view their own transactions
    // Admin and operator can view any transaction
    if (
      req.user.role === "user" &&
      transaction.user._id.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(
        res,
        "Access denied. You can only view your own transactions.",
        403
      );
    }

    return ApiResponse.success(
      res,
      "Transaction fetched successfully",
      transaction
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get all transactions — admin and operator
//  @route   GET /api/v1/transactions
//  @access  Protected (admin, operator)
// ─────────────────────────────────────────────────────
const getAllTransactions = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.type)   filter.type   = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.user)   filter.user   = req.query.user;
    if (req.query.booth)  filter.booth  = req.query.booth;

    // ── Date range filter ─────────────────────────────
    if (req.query.startDate || req.query.endDate) {
      filter.createdAt = {};
      if (req.query.startDate) {
        filter.createdAt.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.createdAt.$lte = new Date(req.query.endDate);
      }
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("user",    "name email")
        .populate("vehicle", "licensePlate vehicleType")
        .populate("booth",   "name boothCode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      res,
      "Transactions fetched successfully",
      transactions,
      transactions.length,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get all transactions for a booth
//  @route   GET /api/v1/transactions/booth/:boothId
//  @access  Protected (admin, operator)
// ─────────────────────────────────────────────────────
const getBoothTransactions = async (req, res, next) => {
  try {
    const booth = await Booth.findById(req.params.boothId);

    if (!booth) {
      return ApiResponse.error(res, "Booth not found", 404);
    }

    const filter = { booth: req.params.boothId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.type)   filter.type   = req.query.type;

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate("user",    "name email")
        .populate("vehicle", "licensePlate vehicleType")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      res,
      `Transactions for booth ${booth.name} fetched successfully`,
      transactions,
      transactions.length,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get all transactions for a vehicle
//  @route   GET /api/v1/transactions/vehicle/:vehicleId
//  @access  Protected
// ─────────────────────────────────────────────────────
const getVehicleTransactions = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);

    if (!vehicle) {
      return ApiResponse.error(res, "Vehicle not found", 404);
    }

    // ── Check ownership ───────────────────────────────
    if (
      req.user.role === "user" &&
      vehicle.owner.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(
        res,
        "Access denied. You can only view your own vehicle transactions.",
        403
      );
    }

    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({ vehicle: req.params.vehicleId })
        .populate("booth", "name boothCode")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({ vehicle: req.params.vehicleId }),
    ]);

    return ApiResponse.paginated(
      res,
      "Vehicle transactions fetched successfully",
      transactions,
      transactions.length,
      {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Refund a transaction
//  @route   POST /api/v1/transactions/:id/refund
//  @access  Protected (admin only)
//
//  Why refunds happen:
//  - System error charged wrong amount
//  - Vehicle passed wrong lane
//  - Technical malfunction at booth
// ─────────────────────────────────────────────────────
const refundTransaction = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return ApiResponse.error(
        res,
        "Please provide a reason for the refund",
        400
      );
    }

    // ── Find original transaction ─────────────────────
    const originalTransaction = await Transaction.findById(req.params.id);

    if (!originalTransaction) {
      return ApiResponse.error(res, "Transaction not found", 404);
    }

    if (originalTransaction.status !== "success") {
      return ApiResponse.error(
        res,
        "Only successful transactions can be refunded",
        400
      );
    }

    if (originalTransaction.type !== "toll") {
      return ApiResponse.error(
        res,
        "Only toll transactions can be refunded",
        400
      );
    }

    // ── Find user account ─────────────────────────────
    const account = await Account.findOne({
      owner: originalTransaction.user,
    });

    if (!account) {
      return ApiResponse.error(res, "User account not found", 404);
    }

    // ── Refund amount to account ──────────────────────
    const balanceBefore = account.balance;
    account.balance     += originalTransaction.amount;
    await account.save();

    // ── Create refund transaction record ──────────────
    const refundTransaction = await Transaction.create({
      transactionRef: generateTransactionRef(),
      type:           "refund",
      status:         "success",
      user:           originalTransaction.user,
      vehicle:        originalTransaction.vehicle,
      booth:          originalTransaction.booth,
      operator:       req.user._id,
      amount:         originalTransaction.amount,
      balanceBefore,
      balanceAfter:   account.balance,
      description:    `Refund for transaction ${originalTransaction.transactionRef}. Reason: ${reason}`,
      ipAddress:      req.ip,
    });

    // ── Update original transaction status ────────────
    originalTransaction.status      = "failed";
    originalTransaction.description = `Refunded. Reason: ${reason}`;
    await originalTransaction.save();

    return ApiResponse.success(
      res,
      "Transaction refunded successfully",
      {
        refundRef:       refundTransaction.transactionRef,
        originalRef:     originalTransaction.transactionRef,
        refundAmount:    originalTransaction.amount,
        balanceBefore,
        balanceAfter:    account.balance,
        reason,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processToll,
  getMyTransactions,
  getTransactionByRef,
  getAllTransactions,
  getBoothTransactions,
  getVehicleTransactions,
  refundTransaction,
};