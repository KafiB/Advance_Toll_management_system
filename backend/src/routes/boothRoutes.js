const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/boothController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────────────
//  BOOTH ROUTES
//  Base URL: /api/v1/booths
//
//  WHO CAN DO WHAT:
//  user     → view booths and rates only
//  operator → view booths, view their assigned booth
//  admin    → full access
// ─────────────────────────────────────────────────────

// ── PUBLIC-ISH ROUTES ─────────────────────────────────
// Any logged in user can view booths
// Needed so vehicle owners know toll rates

// GET /api/v1/booths
// Get all active booths with their toll rates
router.get("/", protect, getAllBooths);

// ── ADMIN ONLY ROUTES ─────────────────────────────────

// POST /api/v1/booths
// Create a new toll booth — admin only
router.post(
  "/",
  protect,
  authorize("admin"),
  createBooth
);

// PUT /api/v1/booths/:id/assign-operator
// Assign an operator to a booth — admin only
router.put(
  "/:id/assign-operator",
  protect,
  authorize("admin"),
  assignOperator
);

// PUT /api/v1/booths/:id/remove-operator
// Remove operator from booth — admin only
router.put(
  "/:id/remove-operator",
  protect,
  authorize("admin"),
  removeOperator
);

// PUT /api/v1/booths/:id/status
// Update booth status — admin only
// operational, maintenance, closed
router.put(
  "/:id/status",
  protect,
  authorize("admin"),
  updateBoothStatus
);

// PUT /api/v1/booths/:id/toll-rates
// Update toll rates for a booth — admin only
router.put(
  "/:id/toll-rates",
  protect,
  authorize("admin"),
  updateTollRates
);

// DELETE /api/v1/booths/:id
// Soft delete booth — admin only
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  deleteBooth
);

// ── ADMIN + OPERATOR ROUTES ───────────────────────────

// GET /api/v1/booths/:id/stats
// Get booth statistics — admin and operator
router.get(
  "/:id/stats",
  protect,
  authorize("admin", "operator"),
  getBoothStats
);

// ── INDIVIDUAL BOOTH ROUTE ────────────────────────────
// Must come LAST — same reason as vehicle and account
// :id would match other routes if placed first

// GET /api/v1/booths/:id
// Get single booth by id
router.get("/:id", protect, getBoothById);

// PUT /api/v1/booths/:id
// Update booth details — admin only
router.put(
  "/:id",
  protect,
  authorize("admin"),
  updateBooth
);

module.exports = router;