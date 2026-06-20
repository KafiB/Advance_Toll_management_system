const express = require("express");
const router = express.Router();

const {
  blacklistVehicle,
  resolveBlacklist,
  getBlacklistedVehicles,
  getBlacklistById,
  getVehicleBlacklistHistory,
  getMyBlacklistHistory,
} = require("../controllers/blacklistController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────────────
//  BLACKLIST ROUTES
//  Base URL: /api/v1/blacklist
//
//  WHO CAN DO WHAT:
//  user     → view their own blacklist history
//  operator → view blacklisted vehicles
//  admin    → full access
// ─────────────────────────────────────────────────────

// ── USER ROUTES ───────────────────────────────────────

// GET /api/v1/blacklist/my-history
// Get logged in user's own blacklist history
router.get("/my-history", protect, getMyBlacklistHistory);

// ── ADMIN + OPERATOR ROUTES ───────────────────────────

// GET /api/v1/blacklist
// Get all blacklisted vehicles
router.get(
  "/",
  protect,
  authorize("admin", "operator"),
  getBlacklistedVehicles
);

// GET /api/v1/blacklist/vehicle/:vehicleId
// Get full blacklist history for a specific vehicle
router.get(
  "/vehicle/:vehicleId",
  protect,
  authorize("admin", "operator"),
  getVehicleBlacklistHistory
);

// ── ADMIN ONLY ROUTES ─────────────────────────────────

// POST /api/v1/blacklist
// Blacklist a vehicle — admin only
router.post(
  "/",
  protect,
  authorize("admin"),
  blacklistVehicle
);

// PUT /api/v1/blacklist/:id/resolve
// Resolve a blacklist — admin only
router.put(
  "/:id/resolve",
  protect,
  authorize("admin"),
  resolveBlacklist
);

// ── INDIVIDUAL BLACKLIST ROUTE ────────────────────────
// Must come LAST

// GET /api/v1/blacklist/:id
// Get single blacklist record by id
router.get(
  "/:id",
  protect,
  authorize("admin", "operator"),
  getBlacklistById
);

module.exports = router;