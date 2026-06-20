const Booth = require("../models/booth.model");
const User = require("../models/user.model");
const ApiResponse = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────
//  @desc    Create a new toll booth
//  @route   POST /api/v1/booths
//  @access  Protected (admin only)
// ─────────────────────────────────────────────────────
const createBooth = async (req, res, next) => {
  try {
    const {
      name,
      boothCode,
      description,
      location,
      highwayName,
      highwayNumber,
      totalLanes,
      tollRates,
    } = req.body;

    // ── Step 1: Validate required fields ──────────────
    if (!name || !boothCode || !location || !highwayName || !totalLanes) {
      return ApiResponse.error(
        res,
        "Please provide name, boothCode, location, highwayName and totalLanes",
        400
      );
    }

    if (!location.address || !location.city || !location.state) {
      return ApiResponse.error(
        res,
        "Please provide location address, city and state",
        400
      );
    }

    // ── Step 2: Check if booth code already exists ────
    const existingBooth = await Booth.findOne({
      $or: [
        { boothCode: boothCode.toUpperCase() },
        { name },
      ],
    });

    if (existingBooth) {
      const field = existingBooth.boothCode === boothCode.toUpperCase()
        ? "Booth code"
        : "Booth name";
      return ApiResponse.error(res, `${field} already exists`, 400);
    }

    // ── Step 3: Validate activeLanes ──────────────────
    if (totalLanes < 1) {
      return ApiResponse.error(res, "Must have at least 1 lane", 400);
    }

    // ── Step 4: Create booth ───────────────────────────
    const booth = await Booth.create({
      name,
      boothCode: boothCode.toUpperCase(),
      description:   description   || null,
      location,
      highwayName,
      highwayNumber: highwayNumber || null,
      totalLanes,
      activeLanes:   totalLanes,
      tollRates:     tollRates     || {},
    });

    return ApiResponse.success(
      res,
      "Toll booth created successfully",
      booth,
      201
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get all booths
//  @route   GET /api/v1/booths
//  @access  Protected (all users)
// ─────────────────────────────────────────────────────
const getAllBooths = async (req, res, next) => {
  try {
    // ── Build filter from query params ────────────────
    const filter = {};

    if (req.query.status)       filter.status             = req.query.status;
    if (req.query.isActive)     filter.isActive           = req.query.isActive === "true";
    if (req.query.city)         filter["location.city"]   = req.query.city;
    if (req.query.highwayName)  filter.highwayName        = req.query.highwayName;

    // ── Pagination ────────────────────────────────────
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;

    // ── Run both queries in parallel ──────────────────
    const [booths, total] = await Promise.all([
      Booth.find(filter)
        .populate("assignedOperator", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booth.countDocuments(filter),
    ]);

    return ApiResponse.paginated(
      res,
      "Booths fetched successfully",
      booths,
      booths.length,
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
//  @desc    Get single booth by ID
//  @route   GET /api/v1/booths/:id
//  @access  Protected (all users)
// ─────────────────────────────────────────────────────
const getBoothById = async (req, res, next) => {
  try {
    const booth = await Booth.findById(req.params.id).populate(
      "assignedOperator",
      "name email phone"
    );

    if (!booth) {
      return ApiResponse.error(res, "Booth not found", 404);
    }

    return ApiResponse.success(res, "Booth fetched successfully", booth);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Update booth details
//  @route   PUT /api/v1/booths/:id
//  @access  Protected (admin only)
// ─────────────────────────────────────────────────────
const updateBooth = async (req, res, next) => {
  try {
    // ── Only allow safe fields to be updated ──────────
    const allowedFields = [
      "name",
      "description",
      "location",
      "highwayName",
      "highwayNumber",
      "totalLanes",
      "activeLanes",
      "maintenanceNotes",
      "lastMaintenanceDate",
      "nextMaintenanceDate",
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

    // ── Validate activeLanes if provided ──────────────
    if (updates.activeLanes !== undefined) {
      const booth = await Booth.findById(req.params.id);
      if (!booth) {
        return ApiResponse.error(res, "Booth not found", 404);
      }
      if (updates.activeLanes > booth.totalLanes) {
        return ApiResponse.error(
          res,
          "Active lanes cannot exceed total lanes",
          400
        );
      }
    }

    const booth = await Booth.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate("assignedOperator", "name email phone");

    if (!booth) {
      return ApiResponse.error(res, "Booth not found", 404);
    }

    return ApiResponse.success(res, "Booth updated successfully", booth);
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Delete booth (soft delete)
//  @route   DELETE /api/v1/booths/:id
//  @access  Protected (admin only)
// ─────────────────────────────────────────────────────
const deleteBooth = async (req, res, next) => {
  try {
    const booth = await Booth.findById(req.params.id);

    if (!booth) {
      return ApiResponse.error(res, "Booth not found", 404);
    }

    // Soft delete — mark as inactive
    booth.isActive = false;
    booth.status   = "closed";
    await booth.save();

    return ApiResponse.success(res, "Booth deactivated successfully");
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Assign operator to booth
//  @route   PUT /api/v1/booths/:id/assign-operator
//  @access  Protected (admin only)
//
//  In real toll systems:
//  Each booth shift has a dedicated operator
//  Admin assigns operators to booths
// ─────────────────────────────────────────────────────
const assignOperator = async (req, res, next) => {
  try {
    const { operatorId } = req.body;

    if (!operatorId) {
      return ApiResponse.error(res, "Please provide an operator ID", 400);
    }

    // ── Verify the user exists and is an operator ─────
    const operator = await User.findById(operatorId);

    if (!operator) {
      return ApiResponse.error(res, "Operator not found", 404);
    }

    if (operator.role !== "operator" && operator.role !== "admin") {
      return ApiResponse.error(
        res,
        "User must have operator or admin role to be assigned to a booth",
        400
      );
    }

    if (!operator.isActive) {
      return ApiResponse.error(
        res,
        "Cannot assign a deactivated operator to a booth",
        400
      );
    }

    // ── Check if operator already assigned to another booth
    const existingAssignment = await Booth.findOne({
      assignedOperator: operatorId,
      isActive:         true,
    });

    if (existingAssignment) {
      return ApiResponse.error(
        res,
        `This operator is already assigned to booth: ${existingAssignment.name}`,
        400
      );
    }

    const booth = await Booth.findByIdAndUpdate(
      req.params.id,
      { assignedOperator: operatorId },
      { new: true }
    ).populate("assignedOperator", "name email phone");

    if (!booth) {
      return ApiResponse.error(res, "Booth not found", 404);
    }

    return ApiResponse.success(
      res,
      "Operator assigned to booth successfully",
      booth
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Remove operator from booth
//  @route   PUT /api/v1/booths/:id/remove-operator
//  @access  Protected (admin only)
// ─────────────────────────────────────────────────────
const removeOperator = async (req, res, next) => {
  try {
    const booth = await Booth.findByIdAndUpdate(
      req.params.id,
      { assignedOperator: null },
      { new: true }
    );

    if (!booth) {
      return ApiResponse.error(res, "Booth not found", 404);
    }

    return ApiResponse.success(
      res,
      "Operator removed from booth successfully",
      booth
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Update booth status
//  @route   PUT /api/v1/booths/:id/status
//  @access  Protected (admin only)
// ─────────────────────────────────────────────────────
const updateBoothStatus = async (req, res, next) => {
  try {
    const { status, maintenanceNotes } = req.body;

    if (!status) {
      return ApiResponse.error(res, "Please provide a status", 400);
    }

    const validStatuses = ["operational", "maintenance", "closed"];
    if (!validStatuses.includes(status)) {
      return ApiResponse.error(
        res,
        "Status must be operational, maintenance, or closed",
        400
      );
    }

    const updates = { status };

    // If setting to maintenance — save notes and date
    if (status === "maintenance") {
      updates.lastMaintenanceDate = new Date();
      if (maintenanceNotes) {
        updates.maintenanceNotes = maintenanceNotes;
      }
    }

    // If setting back to operational — clear notes
    if (status === "operational") {
      updates.maintenanceNotes = null;
    }

    const booth = await Booth.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate("assignedOperator", "name email phone");

    if (!booth) {
      return ApiResponse.error(res, "Booth not found", 404);
    }

    return ApiResponse.success(
      res,
      `Booth status updated to ${status} successfully`,
      booth
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Update toll rates for a booth
//  @route   PUT /api/v1/booths/:id/toll-rates
//  @access  Protected (admin only)
// ─────────────────────────────────────────────────────
const updateTollRates = async (req, res, next) => {
  try {
    const { motorcycle, car, suv, van, truck, bus } = req.body;

    // ── At least one rate must be provided ────────────
    if (
      motorcycle === undefined &&
      car        === undefined &&
      suv        === undefined &&
      van        === undefined &&
      truck      === undefined &&
      bus        === undefined
    ) {
      return ApiResponse.error(
        res,
        "Please provide at least one toll rate to update",
        400
      );
    }

    // ── Build update object ───────────────────────────
    const rateUpdates = {};
    if (motorcycle !== undefined) rateUpdates["tollRates.motorcycle"] = motorcycle;
    if (car        !== undefined) rateUpdates["tollRates.car"]        = car;
    if (suv        !== undefined) rateUpdates["tollRates.suv"]        = suv;
    if (van        !== undefined) rateUpdates["tollRates.van"]        = van;
    if (truck      !== undefined) rateUpdates["tollRates.truck"]      = truck;
    if (bus        !== undefined) rateUpdates["tollRates.bus"]        = bus;

    // ── Validate no negative rates ────────────────────
    const rateValues = Object.values(req.body).filter(
      (v) => typeof v === "number"
    );
    if (rateValues.some((rate) => rate < 0)) {
      return ApiResponse.error(res, "Toll rates cannot be negative", 400);
    }

    const booth = await Booth.findByIdAndUpdate(
      req.params.id,
      rateUpdates,
      { new: true, runValidators: true }
    );

    if (!booth) {
      return ApiResponse.error(res, "Booth not found", 404);
    }

    return ApiResponse.success(
      res,
      "Toll rates updated successfully",
      {
        boothName: booth.name,
        tollRates: booth.tollRates,
      }
    );
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get booth statistics
//  @route   GET /api/v1/booths/:id/stats
//  @access  Protected (admin, operator)
// ─────────────────────────────────────────────────────
const getBoothStats = async (req, res, next) => {
  try {
    const booth = await Booth.findById(req.params.id).populate(
      "assignedOperator",
      "name email phone"
    );

    if (!booth) {
      return ApiResponse.error(res, "Booth not found", 404);
    }

    return ApiResponse.success(
      res,
      "Booth statistics fetched successfully",
      {
        boothName:          booth.name,
        boothCode:          booth.boothCode,
        status:             booth.status,
        totalLanes:         booth.totalLanes,
        activeLanes:        booth.activeLanes,
        assignedOperator:   booth.assignedOperator,
        totalTransactions:  booth.totalTransactions,
        totalRevenue:       booth.totalRevenue,
        todayTransactions:  booth.todayTransactions,
        todayRevenue:       booth.todayRevenue,
        lastTransactionDate: booth.lastTransactionDate,
        lastMaintenanceDate: booth.lastMaintenanceDate,
        nextMaintenanceDate: booth.nextMaintenanceDate,
        tollRates:          booth.tollRates,
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooth,
  getAllBooths,
  getBoothById,
  updateBooth,
  deleteBooth,
  assignOperator,
  removeOperator,
  updateBoothStatus,
  updateTollRates,
  getBoothStats,
};