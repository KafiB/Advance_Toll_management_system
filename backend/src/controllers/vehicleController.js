const Vehicle = require("../models/vehicle.model");
const User = require("../models/user.model");
const ApiResponse = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────
//  CONSTANTS
//  Toll rates per vehicle type in BDT (Bangladesh Taka)
//  In US systems like E-ZPass, rates vary by:
//  vehicle class, time of day, and highway
//  We follow the same classification system
// ─────────────────────────────────────────────────────
const TOLL_RATES = {
  motorcycle: 50,
  car:        100,
  suv:        150,
  van:        200,
  truck:      300,
  bus:        300,
};

// ─────────────────────────────────────────────────────
//  @desc    Register a new vehicle
//  @route   POST /api/v1/vehicles/register
//  @access  Protected (user)
// ─────────────────────────────────────────────────────
const registerVehicle = async (req, res, next) => {
  try {
    const {
      licensePlate,
      make,
      model,
      year,
      color,
      vehicleType,
      registrationNumber,
      registrationExpiry,
      insuranceNumber,
      insuranceExpiry,
    } = req.body;

    // ── Step 1: Validate required fields ──────────────
    if (
      !licensePlate ||
      !make        ||
      !model       ||
      !year        ||
      !color       ||
      !vehicleType ||
      !registrationNumber ||
      !registrationExpiry
    ) {
      return ApiResponse.error(
        res,
        "Please provide all required vehicle details",
        400
      );
    }

    // ── Step 2: Check if plate already registered ─────
    const existingVehicle = await Vehicle.findOne({
      $or: [
        { licensePlate: licensePlate.toUpperCase() },
        { registrationNumber: registrationNumber.toUpperCase() },
      ],
    });

    if (existingVehicle) {
      const field =
        existingVehicle.licensePlate === licensePlate.toUpperCase()
          ? "License plate"
          : "Registration number";
      return ApiResponse.error(res, `${field} is already registered`, 400);
    }

    // ── Step 3: Check registration expiry ─────────────
    if (new Date(registrationExpiry) < new Date()) {
      return ApiResponse.error(
        res,
        "Vehicle registration has already expired. Please renew before registering.",
        400
      );
    }

    // ── Step 4: Create vehicle ─────────────────────────
    // owner is set from req.user — cannot be faked
    // User cannot register vehicle for someone else
    const vehicle = await Vehicle.create({
      owner: req.user._id,
      licensePlate,
      make,
      model,
      year,
      color,
      vehicleType,
      registrationNumber,
      registrationExpiry,
      insuranceNumber:  insuranceNumber  || null,
      insuranceExpiry:  insuranceExpiry  || null,
    });

    // ── Step 5: Populate owner details ────────────────
    // populate() replaces owner id with actual user data
    await vehicle.populate("owner", "name email phone");

    return ApiResponse.success(
      res,
      "Vehicle registered successfully",
      {
        vehicle,
        tollRate: TOLL_RATES[vehicleType],
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get all vehicles of logged in user
//  @route   GET /api/v1/vehicles/my-vehicles
//  @access  Protected (user)
// ─────────────────────────────────────────────────────
const getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({
      owner: req.user._id,
      isActive: true,
    }).sort({ createdAt: -1 }); // newest first

    return ApiResponse.success(
      res,
      "Vehicles fetched successfully",
      {
        count: vehicles.length,
        vehicles,
      }
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get single vehicle by ID
//  @route   GET /api/v1/vehicles/:id
//  @access  Protected
// ─────────────────────────────────────────────────────
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate(
      "owner",
      "name email phone"
    );

    // ── Check vehicle exists ───────────────────────────
    if (!vehicle) {
      return ApiResponse.error(res, "Vehicle not found", 404);
    }

    // ── Check ownership ───────────────────────────────
    // User can only view their own vehicle
    // Admin and operator can view any vehicle
    if (
      req.user.role === "user" &&
      vehicle.owner._id.toString() !== req.user._id.toString()
    ) {
      return ApiResponse.error(
        res,
        "Access denied. You can only view your own vehicles.",
        403
      );
    }

    return ApiResponse.success(res, "Vehicle fetched successfully", vehicle);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get all vehicles — admin and operator
//  @route   GET /api/v1/vehicles
//  @access  Protected (admin, operator)
// ─────────────────────────────────────────────────────
const getAllVehicles = async (req, res, next) => {
  try {
    // ── Build filter from query params ────────────────
    // Example: /api/v1/vehicles?vehicleType=truck&isBlacklisted=true
    const filter = {};

    if (req.query.vehicleType)    filter.vehicleType    = req.query.vehicleType;
    if (req.query.isBlacklisted)  filter.isBlacklisted  = req.query.isBlacklisted === "true";
    if (req.query.isActive)       filter.isActive       = req.query.isActive === "true";

    // ── Pagination ────────────────────────────────────
    // page=1&limit=10 — standard pagination
    // This is how every large system handles big lists
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // ── Run queries in parallel for performance ───────
    // Promise.all runs both queries at the same time
    // instead of waiting for one then the other
    // This is a FAANG level performance technique
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate("owner", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Vehicle.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      res,
      "Vehicles fetched successfully",
      vehicles,
      vehicles.length,
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
//  @desc    Update vehicle details
//  @route   PUT /api/v1/vehicles/:id
//  @access  Protected (owner or admin)
// ─────────────────────────────────────────────────────
const updateVehicle = async (req, res, next) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);

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
        "Access denied. You can only update your own vehicles.",
        403
      );
    }

    // ── Only allow safe fields to be updated ──────────
    // License plate and RFID cannot be changed here
    // RFID has its own dedicated route
    const allowedFields = [
      "make",
      "model",
      "year",
      "color",
      "vehicleType",
      "registrationExpiry",
      "insuranceNumber",
      "insuranceExpiry",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return ApiResponse.error(res, "No valid fields provided to update", 400);
    }

    vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate("owner", "name email phone");

    return ApiResponse.success(res, "Vehicle updated successfully", vehicle);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Delete vehicle (soft delete)
//  @route   DELETE /api/v1/vehicles/:id
//  @access  Protected (admin only)
//
//  Why soft delete?
//  We never permanently delete vehicles because
//  transaction history must remain intact.
//  We just mark it inactive — same as Google, Uber.
// ─────────────────────────────────────────────────────
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);

    if (!vehicle) {
      return ApiResponse.error(res, "Vehicle not found", 404);
    }

    // Soft delete — just mark as inactive
    vehicle.isActive = false;
    await vehicle.save();

    return ApiResponse.success(res, "Vehicle deactivated successfully");
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Assign RFID tag to vehicle
//  @route   PUT /api/v1/vehicles/:id/assign-rfid
//  @access  Protected (admin, operator)
//
//  In real toll systems:
//  Vehicle owner visits toll registration office
//  Operator physically sticks RFID tag on windshield
//  Then assigns the tag number in the system
// ─────────────────────────────────────────────────────
const assignRfidTag = async (req, res, next) => {
  try {
    const { rfidTag } = req.body;

    if (!rfidTag) {
      return ApiResponse.error(res, "Please provide an RFID tag number", 400);
    }

    // ── Check RFID not already assigned to another vehicle
    const existingRfid = await Vehicle.findOne({ rfidTag });
    if (existingRfid) {
      return ApiResponse.error(
        res,
        "This RFID tag is already assigned to another vehicle",
        400
      );
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { rfidTag },
      { new: true, runValidators: true }
    ).populate("owner", "name email phone");

    if (!vehicle) {
      return ApiResponse.error(res, "Vehicle not found", 404);
    }

    return ApiResponse.success(
      res,
      "RFID tag assigned successfully",
      vehicle
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get vehicle by RFID tag
//  @route   GET /api/v1/vehicles/rfid/:rfidTag
//  @access  Protected (admin, operator)
//
//  This is called automatically when a vehicle
//  passes through a toll booth RFID reader
// ─────────────────────────────────────────────────────
const getVehicleByRfid = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({
      rfidTag: req.params.rfidTag,
    }).populate("owner", "name email phone");

    if (!vehicle) {
      return ApiResponse.error(
        res,
        "No vehicle found with this RFID tag",
        404
      );
    }

    // ── Check if vehicle is blacklisted ───────────────
    if (vehicle.isBlacklisted) {
      return ApiResponse.error(
        res,
        `Vehicle is blacklisted. Reason: ${vehicle.blacklistReason}`,
        403
      );
    }

    return ApiResponse.success(res, "Vehicle found", vehicle);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get vehicle by license plate
//  @route   GET /api/v1/vehicles/plate/:licensePlate
//  @access  Protected (admin, operator)
// ─────────────────────────────────────────────────────
const getVehicleByPlate = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOne({
      licensePlate: req.params.licensePlate.toUpperCase(),
    }).populate("owner", "name email phone");

    if (!vehicle) {
      return ApiResponse.error(
        res,
        "No vehicle found with this license plate",
        404
      );
    }

    return ApiResponse.success(res, "Vehicle found", vehicle);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Blacklist a vehicle
//  @route   PUT /api/v1/vehicles/:id/blacklist
//  @access  Protected (admin only)
// ─────────────────────────────────────────────────────
const blacklistVehicle = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return ApiResponse.error(
        res,
        "Please provide a reason for blacklisting",
        400
      );
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        isBlacklisted:   true,
        blacklistReason: reason,
      },
      { new: true }
    ).populate("owner", "name email phone");

    if (!vehicle) {
      return ApiResponse.error(res, "Vehicle not found", 404);
    }

    return ApiResponse.success(
      res,
      "Vehicle blacklisted successfully",
      vehicle
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Remove vehicle from blacklist
//  @route   PUT /api/v1/vehicles/:id/remove-blacklist
//  @access  Protected (admin only)
// ─────────────────────────────────────────────────────
const removeBlacklist = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      {
        isBlacklisted:   false,
        blacklistReason: null,
      },
      { new: true }
    ).populate("owner", "name email phone");

    if (!vehicle) {
      return ApiResponse.error(res, "Vehicle not found", 404);
    }

    return ApiResponse.success(
      res,
      "Vehicle removed from blacklist successfully",
      vehicle
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerVehicle,
  getMyVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  assignRfidTag,
  getVehicleByRfid,
  getVehicleByPlate,
  getAllVehicles,
  blacklistVehicle,
  removeBlacklist,
};