const Transaction = require("../models/transaction.model");
const Booth = require("../models/booth.model");
const Vehicle = require("../models/vehicle.model");
const User = require("../models/user.model");
const Account = require("../models/account.model");
const ApiResponse = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────
//  HELPER — Get date range boundaries
//  Returns start of today, start of week, start of month
// ─────────────────────────────────────────────────────
const getDateRanges = () => {
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return { startOfToday, startOfWeek, startOfMonth, now };
};

// ─────────────────────────────────────────────────────
//  @desc    Get dashboard summary
//  @route   GET /api/v1/reports/dashboard
//  @access  Protected (admin only)
//
//  This is the FIRST screen an admin sees when they
//  log in — the most important numbers at a glance
// ─────────────────────────────────────────────────────
const getDashboardSummary = async (req, res, next) => {
  try {
    const { startOfToday, startOfWeek, startOfMonth } = getDateRanges();

    // ── Run all aggregations in parallel for performance ─
    const [
      todayStats,
      weekStats,
      monthStats,
      totalStats,
      totalUsers,
      totalVehicles,
      activeBooths,
      activeBlacklists,
    ] = await Promise.all([
      // Today's toll revenue and transaction count
      Transaction.aggregate([
        {
          $match: {
            type: "toll",
            status: "success",
            createdAt: { $gte: startOfToday },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$amount" },
            count:   { $sum: 1 },
          },
        },
      ]),

      // This week's toll revenue
      Transaction.aggregate([
        {
          $match: {
            type: "toll",
            status: "success",
            createdAt: { $gte: startOfWeek },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$amount" },
            count:   { $sum: 1 },
          },
        },
      ]),

      // This month's toll revenue
      Transaction.aggregate([
        {
          $match: {
            type: "toll",
            status: "success",
            createdAt: { $gte: startOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$amount" },
            count:   { $sum: 1 },
          },
        },
      ]),

      // All-time toll revenue
      Transaction.aggregate([
        {
          $match: { type: "toll", status: "success" },
        },
        {
          $group: {
            _id: null,
            revenue: { $sum: "$amount" },
            count:   { $sum: 1 },
          },
        },
      ]),

      // Total registered users
      User.countDocuments({ role: "user" }),

      // Total registered vehicles
      Vehicle.countDocuments({ isActive: true }),

      // Active booths
      Booth.countDocuments({ status: "operational", isActive: true }),

      // Active blacklist count
      require("../models/blacklist.model").countDocuments({ status: "active" }),
    ]);

    // ── Helper to safely extract aggregation results ──
    const extract = (result) => ({
      revenue: result[0]?.revenue || 0,
      count:   result[0]?.count   || 0,
    });

    return ApiResponse.success(res, "Dashboard summary fetched successfully", {
      today:   extract(todayStats),
      thisWeek:  extract(weekStats),
      thisMonth: extract(monthStats),
      allTime:   extract(totalStats),
      overview: {
        totalUsers,
        totalVehicles,
        activeBooths,
        activeBlacklists,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get revenue report with custom date range
//  @route   GET /api/v1/reports/revenue?startDate=...&endDate=...&groupBy=day
//  @access  Protected (admin only)
//
//  groupBy options: day, week, month
// ─────────────────────────────────────────────────────
const getRevenueReport = async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    // ── Default to last 30 days if no dates provided ──
    const end   = endDate   ? new Date(endDate)   : new Date();
    const start = startDate ? new Date(startDate) : new Date(end - 30 * 24 * 60 * 60 * 1000);

    // ── Determine grouping format ─────────────────────
    let dateFormat = "%Y-%m-%d"; // default: day
    if (groupBy === "month") dateFormat = "%Y-%m";
    if (groupBy === "week")  dateFormat = "%Y-%U";

    const revenueData = await Transaction.aggregate([
      {
        $match: {
          type:   "toll",
          status: "success",
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: "$createdAt" },
          },
          revenue:      { $sum: "$amount" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ── Calculate totals ───────────────────────────────
    const totalRevenue      = revenueData.reduce((sum, d) => sum + d.revenue, 0);
    const totalTransactions = revenueData.reduce((sum, d) => sum + d.transactions, 0);

    return ApiResponse.success(res, "Revenue report fetched successfully", {
      dateRange: { start, end },
      groupBy:   groupBy || "day",
      summary: {
        totalRevenue,
        totalTransactions,
        averagePerTransaction: totalTransactions > 0
          ? Math.round((totalRevenue / totalTransactions) * 100) / 100
          : 0,
      },
      data: revenueData.map((d) => ({
        date:        d._id,
        revenue:     d.revenue,
        transactions: d.transactions,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get booth performance comparison
//  @route   GET /api/v1/reports/booth-performance
//  @access  Protected (admin only)
// ─────────────────────────────────────────────────────
const getBoothPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {
      type:   "toll",
      status: "success",
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate)   matchStage.createdAt.$lte = new Date(endDate);
    }

    const performance = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:          "$booth",
          revenue:      { $sum: "$amount" },
          transactions: { $sum: 1 },
          averageToll:  { $avg: "$amount" },
        },
      },
      {
        $lookup: {
          from:         "booths",
          localField:   "_id",
          foreignField: "_id",
          as:           "boothInfo",
        },
      },
      { $unwind: "$boothInfo" },
      {
        $project: {
          boothId:      "$_id",
          boothName:    "$boothInfo.name",
          boothCode:    "$boothInfo.boothCode",
          status:       "$boothInfo.status",
          revenue:      1,
          transactions: 1,
          averageToll:  { $round: ["$averageToll", 2] },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    // ── Calculate market share percentage ─────────────
    const totalRevenue = performance.reduce((sum, b) => sum + b.revenue, 0);

    const performanceWithShare = performance.map((b) => ({
      ...b,
      revenueShare: totalRevenue > 0
        ? Math.round((b.revenue / totalRevenue) * 10000) / 100
        : 0,
    }));

    return ApiResponse.success(res, "Booth performance fetched successfully", {
      totalRevenue,
      totalBooths: performance.length,
      booths: performanceWithShare,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get revenue breakdown by vehicle type
//  @route   GET /api/v1/reports/vehicle-types
//  @access  Protected (admin only)
// ─────────────────────────────────────────────────────
const getVehicleTypeBreakdown = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {
      type:   "toll",
      status: "success",
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate)   matchStage.createdAt.$lte = new Date(endDate);
    }

    const breakdown = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:          "$tollDetails.vehicleType",
          revenue:      { $sum: "$amount" },
          transactions: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    const totalRevenue = breakdown.reduce((sum, v) => sum + v.revenue, 0);

    const result = breakdown.map((v) => ({
      vehicleType:  v._id || "unknown",
      revenue:      v.revenue,
      transactions: v.transactions,
      revenueShare: totalRevenue > 0
        ? Math.round((v.revenue / totalRevenue) * 10000) / 100
        : 0,
    }));

    return ApiResponse.success(res, "Vehicle type breakdown fetched successfully", {
      totalRevenue,
      breakdown: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get traffic patterns by hour of day
//  @route   GET /api/v1/reports/traffic-patterns
//  @access  Protected (admin only)
//
//  Helps identify peak hours for staffing decisions
// ─────────────────────────────────────────────────────
const getTrafficPatterns = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {
      type:   "toll",
      status: "success",
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate)   matchStage.createdAt.$lte = new Date(endDate);
    }

    const patterns = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id:          { $hour: "$createdAt" },
          transactions: { $sum: 1 },
          revenue:      { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ── Fill in missing hours with zero ───────────────
    // Ensures all 24 hours appear even with no data
    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const found = patterns.find((p) => p._id === hour);
      return {
        hour,
        transactions: found ? found.transactions : 0,
        revenue:      found ? found.revenue      : 0,
      };
    });

    // ── Find peak hour ─────────────────────────────────
    const peakHour = hourlyData.reduce(
      (max, curr) => (curr.transactions > max.transactions ? curr : max),
      hourlyData[0]
    );

    return ApiResponse.success(res, "Traffic patterns fetched successfully", {
      peakHour: {
        hour:         peakHour.hour,
        transactions: peakHour.transactions,
      },
      hourlyData,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get top vehicles by toll spent or trips
//  @route   GET /api/v1/reports/top-vehicles?sortBy=spent&limit=10
//  @access  Protected (admin only)
//
//  sortBy options: spent, trips
// ─────────────────────────────────────────────────────
const getTopVehicles = async (req, res, next) => {
  try {
    const limit  = parseInt(req.query.limit) || 10;
    const sortBy = req.query.sortBy === "trips" ? "totalTrips" : "totalTollPaid";

    const topVehicles = await Vehicle.find({ isActive: true })
      .populate("owner", "name email phone")
      .sort({ [sortBy]: -1 })
      .limit(limit)
      .select("licensePlate make model vehicleType totalTrips totalTollPaid owner");

    return ApiResponse.success(res, "Top vehicles fetched successfully", {
      sortBy,
      count: topVehicles.length,
      vehicles: topVehicles,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────
//  @desc    Get failure analysis
//  @route   GET /api/v1/reports/failure-analysis
//  @access  Protected (admin only)
//
//  Shows why transactions are failing — helps
//  identify system issues or fraud patterns
// ─────────────────────────────────────────────────────
const getFailureAnalysis = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchStage = {
      type:   "toll",
      status: "failed",
    };

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate)   matchStage.createdAt.$lte = new Date(endDate);
    }

    const [failuresByReason, totalFailed, totalToll] = await Promise.all([
      // Group failures by reason
      Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id:   "$failureReason",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Total failed transactions
      Transaction.countDocuments(matchStage),

      // Total toll transactions (success + failed) for failure rate
      Transaction.countDocuments({
        type: "toll",
        ...(matchStage.createdAt && { createdAt: matchStage.createdAt }),
      }),
    ]);

    const failureRate = totalToll > 0
      ? Math.round((totalFailed / totalToll) * 10000) / 100
      : 0;

    return ApiResponse.success(res, "Failure analysis fetched successfully", {
      totalFailedTransactions: totalFailed,
      totalTransactions:       totalToll,
      failureRate,
      breakdown: failuresByReason.map((f) => ({
        reason: f._id || "unknown",
        count:  f.count,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getRevenueReport,
  getBoothPerformance,
  getVehicleTypeBreakdown,
  getTrafficPatterns,
  getTopVehicles,
  getFailureAnalysis,
};