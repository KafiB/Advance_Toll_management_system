const express = require("express");
const router = express.Router();

// ─────────────────────────────────────────────────────
//  Import controller functions
//  These functions do not exist yet — we build them
//  in the next file (vehicleController.js)
//  Routes = what endpoints exist
//  Controller = what those endpoints actually do
// ─────────────────────────────────────────────────────
const {
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
} = require("../controllers/vehicleController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────────────
//  VEHICLE ROUTES
//  Base URL: /api/v1/vehicles
//
//  WHO CAN DO WHAT:
//  user     → register, view, update their own vehicles
//  operator → view all vehicles, assign RFID tags
//  admin    → full access including blacklist
// ─────────────────────────────────────────────────────

// ── USER ROUTES ───────────────────────────────────────
// All routes below require login
// protect middleware runs on every single route here

// POST /api/v1/vehicles/register
// Register a new vehicle under logged in user's account
router.post("/register", protect, registerVehicle);

// GET /api/v1/vehicles/my-vehicles
// Get all vehicles belonging to logged in user
router.get("/my-vehicles", protect, getMyVehicles);

// GET /api/v1/vehicles/plate/:licensePlate
// Search vehicle by license plate number
// operator and admin can use this at toll booth
router.get(
  "/plate/:licensePlate",
  protect,
  authorize("admin", "operator"),
  getVehicleByPlate
);

// GET /api/v1/vehicles/rfid/:rfidTag
// Search vehicle by RFID tag
// Used by toll booth system when vehicle passes through
router.get(
  "/rfid/:rfidTag",
  protect,
  authorize("admin", "operator"),
  getVehicleByRfid
);

// ── ADMIN + OPERATOR ROUTES ───────────────────────────

// GET /api/v1/vehicles
// Get ALL vehicles in the system — admin and operator only
router.get(
  "/",
  protect,
  authorize("admin", "operator"),
  getAllVehicles
);

// PUT /api/v1/vehicles/:id/assign-rfid
// Assign RFID tag to a vehicle — operator and admin only
// This is done physically at the toll registration office
router.put(
  "/:id/assign-rfid",
  protect,
  authorize("admin", "operator"),
  assignRfidTag
);

// ── ADMIN ONLY ROUTES ─────────────────────────────────

// PUT /api/v1/vehicles/:id/blacklist
// Blacklist a vehicle — admin only
// Example: unpaid tolls, stolen vehicle, fraud
router.put(
  "/:id/blacklist",
  protect,
  authorize("admin"),
  blacklistVehicle
);

// PUT /api/v1/vehicles/:id/remove-blacklist
// Remove vehicle from blacklist — admin only
router.put(
  "/:id/remove-blacklist",
  protect,
  authorize("admin"),
  removeBlacklist
);

// ── INDIVIDUAL VEHICLE ROUTES ─────────────────────────
// These use :id parameter — must come LAST
// If placed first, Express would match "my-vehicles"
// as an :id which would break everything

// GET /api/v1/vehicles/:id
// Get single vehicle by its MongoDB id
router.get("/:id", protect, getVehicleById);

// PUT /api/v1/vehicles/:id
// Update vehicle details — owner or admin only
// Validation happens inside controller
router.put("/:id", protect, updateVehicle);

// DELETE /api/v1/vehicles/:id
// Soft delete — marks vehicle inactive, not removed from DB
// Admin only — users cannot delete vehicles
router.delete("/:id", protect, authorize("admin"), deleteVehicle);

module.exports = router;