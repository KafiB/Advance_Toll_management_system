const express = require("express");
const router = express.Router();

const {
  processToll,
  getMyTransactions,
  getTransactionByRef,
  getAllTransactions,
  getBoothTransactions,
  getVehicleTransactions,
  refundTransaction,
} = require("../controllers/transactionController");

const { protect, authorize } = require("../middleware/authMiddleware");
const { transactionLimiter } = require("../middleware/rateLimiter");

// ─────────────────────────────────────────────────────
//  TRANSACTION ROUTES
//  Base URL: /api/v1/transactions
//
//  WHO CAN DO WHAT:
//  user     → view their own transactions only
//  operator → process toll, view booth transactions
//  admin    → full access including refunds
// ─────────────────────────────────────────────────────

// ── CORE TOLL PROCESSING ROUTE ────────────────────────

// POST /api/v1/transactions/process-toll
// This is the MOST IMPORTANT route in the entire system
// Called when a vehicle passes through a toll booth
// transactionLimiter → max 50 requests per minute
// operator and admin can process tolls
router.post(
  "/process-toll",
  protect,
  authorize("admin", "operator"),
  transactionLimiter,
  processToll
);

// ── USER ROUTES ───────────────────────────────────────

// GET /api/v1/transactions/my-transactions
// Get all transactions for logged in user
router.get(
  "/my-transactions",
  protect,
  getMyTransactions
);

// GET /api/v1/transactions/vehicle/:vehicleId
// Get all transactions for a specific vehicle
router.get(
  "/vehicle/:vehicleId",
  protect,
  getVehicleTransactions
);

// ── ADMIN + OPERATOR ROUTES ───────────────────────────

// GET /api/v1/transactions
// Get ALL transactions in the system
router.get(
  "/",
  protect,
  authorize("admin", "operator"),
  getAllTransactions
);

// GET /api/v1/transactions/booth/:boothId
// Get all transactions for a specific booth
router.get(
  "/booth/:boothId",
  protect,
  authorize("admin", "operator"),
  getBoothTransactions
);

// ── ADMIN ONLY ROUTES ─────────────────────────────────

// POST /api/v1/transactions/:id/refund
// Refund a transaction — admin only
router.post(
  "/:id/refund",
  protect,
  authorize("admin"),
  refundTransaction
);

// ── INDIVIDUAL TRANSACTION ROUTE ──────────────────────
// Must come LAST

// GET /api/v1/transactions/:ref
// Get single transaction by reference number
// Example: /api/v1/transactions/TXN-12345678
router.get(
  "/:ref",
  protect,
  getTransactionByRef
);

module.exports = router;