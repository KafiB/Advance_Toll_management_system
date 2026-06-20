const Blacklist = require("../models/blacklist.model");
const Vehicle = require("../models/vehicle.model");
const ApiResponse = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────
//  @desc    Blacklist a vehicle
//  @route   POST /api/v1/blacklist
//  @access  Protected (admin only)
//
//  This creates a permanent record AND marks the
//  vehicle as blacklisted at the same time.
// ─────────────────────────────────────────────────────
const blacklistVehicle = async (req, res, next) => {
  try {
    const { vehicleId, reason, description, unpaidAmount } = req.body;

    // ── Step 1: Validate required fields ──────────────
    if (!vehicleId || !reason || !description) {
      return ApiResponse.error(
        res,
        "Please provide vehicleId, reason and description",
        400
      );
    }

    const validReasons = [
      "unpaid_tolls",
      "fraud",
      "stolen",
      "document_expired",
      "other",
    ];

    if (!validReasons.includes(reason)) {
      return ApiResponse.error(
        res,
        `Reason must be one of: ${validReasons.join(", ")}`,
        400
      );
    }

    // ── Step 2: Find vehicle and owner ────────────────
    const vehicle = await Vehicle.findById(vehicleId).populate(
      "owner",
      "name email phone"
    );

    if (!vehicle) {
      return ApiResponse.error(res, "Vehicle not found", 404);
    }

    // ── Step 3: Check if already blacklisted ──────────
    if (vehicle.isBlacklisted) {
      return ApiResponse.error(
        res,
        "This vehicle is already blacklisted",
        400
      );
    }

    // ── Step 4: Validate unpaidAmount if provided ─────
    let amount = 0;
    if (unpaidAmount !== undefined) {
      amount = parseFloat(unpaidAmount);
      if (isNaN(amount) || amount < 0) {
        return ApiResponse.error(
          res,
          "Please provide a valid unpaid amount",
          400
        );
      }
    }

    // ── Step 5: Create blacklist record ───────────────
    const blacklistRecord = await Blacklist.create({
      vehicle:      vehicle._id,
      owner:        vehicle.owner._id,
      reason,
      description,
      unpaidAmount: amount,
      status:       "active",
      blacklistedBy: req.user._id,
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

    // ── Step 6: Update vehicle status ─────────────────
    vehicle.isBlacklisted   = true;
    vehicle.blacklistReason = description;
    await vehicle.save();

    return ApiResponse.success(
      res,
      "Vehicle blacklisted successfully",
      blacklistRecord,
      201
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Resolve a blacklist
//  @route   PUT /api/v1/blacklist/:id/resolve
//  @access  Protected (admin only)
//
//  This marks the blacklist record as resolved AND
//  removes the blacklist flag from the vehicle.
// ─────────────────────────────────────────────────────
const resolveBlacklist = async (req, res, next) => {
  try {
    const { resolutionNotes } = req.body;

    if (!resolutionNotes) {
      return ApiResponse.error(
        res,
        "Please provide resolution notes",
        400
      );
    }

    // ── Step 1: Find blacklist record ─────────────────
    const blacklistRecord = await Blacklist.findById(req.params.id);

    if (!blacklistRecord) {
      return ApiResponse.error(res, "Blacklist record not found", 404);
    }

    if (blacklistRecord.status === "resolved") {
      return ApiResponse.error(
        res,
        "This blacklist record is already resolved",
        400
      );
    }

    // ── Step 2: Update blacklist record ───────────────
    blacklistRecord.status          = "resolved";
    blacklistRecord.resolvedBy      = req.user._id;
    blacklistRecord.resolvedAt      = new Date();
    blacklistRecord.resolutionNotes = resolutionNotes;
    await blacklistRecord.save();

    // ── Step 3: Remove blacklist flag from vehicle ────
    // Check if vehicle has any OTHER active blacklist records
    // before removing the flag — vehicle might have
    // multiple active blacklist reasons
    const otherActiveBlacklists = await Blacklist.findOne({
      vehicle: blacklistRecord.vehicle,
      status:  "active",
      _id:     { $ne: blacklistRecord._id },
    });

    if (!otherActiveBlacklists) {
      await Vehicle.findByIdAndUpdate(blacklistRecord.vehicle, {
        isBlacklisted:   false,
        blacklistReason: null,
      });
    }

    return ApiResponse.success(
      res,
      "Blacklist resolved successfully",
      blacklistRecord
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get all blacklisted vehicles
//  @route   GET /api/v1/blacklist
//  @access  Protected (admin, operator)
// ─────────────────────────────────────────────────────
const getBlacklistedVehicles = async (req, res, next) => {
  try {
    // ── Build filter ──────────────────────────────────
    const filter = {};

    if (req.query.status) filter.status = req.query.status;
    if (req.query.reason) filter.reason = req.query.reason;

    // Default to showing only active blacklists
    if (!req.query.status) {
      filter.status = "active";
    }

    // ── Pagination ────────────────────────────────────
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    const [records, total] = await Promise.all([
      Blacklist.find(filter)
        .populate("vehicle",       "licensePlate make model vehicleType")
        .populate("owner",         "name email phone")
        .populate("blacklistedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Blacklist.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      res,
      "Blacklisted vehicles fetched successfully",
      records,
      records.length,
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
//  @desc    Get single blacklist record by id
//  @route   GET /api/v1/blacklist/:id
//  @access  Protected (admin, operator)
// ─────────────────────────────────────────────────────
const getBlacklistById = async (req, res, next) => {
  try {
    const record = await Blacklist.findById(req.params.id)
      .populate("vehicle",       "licensePlate make model vehicleType")
      .populate("owner",         "name email phone")
      .populate("blacklistedBy", "name email")
      .populate("resolvedBy",    "name email");

    if (!record) {
      return ApiResponse.error(res, "Blacklist record not found", 404);
    }

    return ApiResponse.success(
      res,
      "Blacklist record fetched successfully",
      record
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get full blacklist history for a vehicle
//  @route   GET /api/v1/blacklist/vehicle/:vehicleId
//  @access  Protected (admin, operator)
//
//  Shows ALL past blacklist records for a vehicle —
//  active and resolved — full audit trail
// ─────────────────────────────────────────────────────
const getVehicleBlacklistHistory = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId);

    if (!vehicle) {
      return ApiResponse.error(res, "Vehicle not found", 404);
    }

    const records = await Blacklist.find({
      vehicle: req.params.vehicleId,
    })
      .populate("blacklistedBy", "name email")
      .populate("resolvedBy",    "name email")
      .sort({ createdAt: -1 });

    return ApiResponse.success(
      res,
      "Vehicle blacklist history fetched successfully",
      {
        vehicle: {
          licensePlate: vehicle.licensePlate,
          isBlacklisted: vehicle.isBlacklisted,
        },
        totalRecords: records.length,
        history: records,
      }
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get logged in user's blacklist history
//  @route   GET /api/v1/blacklist/my-history
//  @access  Protected (user)
//
//  Shows blacklist records for all vehicles owned
//  by the logged in user
// ─────────────────────────────────────────────────────
const getMyBlacklistHistory = async (req, res, next) => {
  try {
    const records = await Blacklist.find({
      owner: req.user._id,
    })
      .populate("vehicle", "licensePlate make model vehicleType")
      .sort({ createdAt: -1 });

    return ApiResponse.success(
      res,
      "Your blacklist history fetched successfully",
      {
        totalRecords: records.length,
        history: records,
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  blacklistVehicle,
  resolveBlacklist,
  getBlacklistedVehicles,
  getBlacklistById,
  getVehicleBlacklistHistory,
  getMyBlacklistHistory,
};