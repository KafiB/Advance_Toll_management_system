const express = require("express");
const router = express.Router();

const {
  getDashboardSummary,
  getRevenueReport,
  getBoothPerformance,
  getVehicleTypeBreakdown,
  getTrafficPatterns,
  getTopVehicles,
  getFailureAnalysis,
} = require("../controllers/reportController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────────────
//  REPORT ROUTES
//  Base URL: /api/v1/reports
//
//  ALL ROUTES ARE ADMIN ONLY
//  Reports contain sensitive business data —
//  operators and users should never access these
// ─────────────────────────────────────────────────────

// GET /api/v1/reports/dashboard
// Overall dashboard summary — today, week, month stats
router.get(
  "/dashboard",
  protect,
  authorize("admin"),
  getDashboardSummary
);

// GET /api/v1/reports/revenue
// Revenue report with custom date range
router.get(
  "/revenue",
  protect,
  authorize("admin"),
  getRevenueReport
);

// GET /api/v1/reports/booth-performance
// Revenue and transaction count per booth
router.get(
  "/booth-performance",
  protect,
  authorize("admin"),
  getBoothPerformance
);

// GET /api/v1/reports/vehicle-types
// Revenue breakdown by vehicle type
router.get(
  "/vehicle-types",
  protect,
  authorize("admin"),
  getVehicleTypeBreakdown
);

// GET /api/v1/reports/traffic-patterns
// Transaction volume by hour of day
router.get(
  "/traffic-patterns",
  protect,
  authorize("admin"),
  getTrafficPatterns
);

// GET /api/v1/reports/top-vehicles
// Top vehicles by toll spent or trip count
router.get(
  "/top-vehicles",
  protect,
  authorize("admin"),
  getTopVehicles
);

// GET /api/v1/reports/failure-analysis
// Analysis of failed transactions
router.get(
  "/failure-analysis",
  protect,
  authorize("admin"),
  getFailureAnalysis
);

module.exports = router;