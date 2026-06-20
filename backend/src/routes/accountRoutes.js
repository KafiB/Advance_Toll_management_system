const express = require("express");
const router = express.Router();

// ─────────────────────────────────────────────────────
//  Import controller functions
//  Controller will be built in the next file
// ─────────────────────────────────────────────────────
const {
  createAccount,
  getMyAccount,
  topUpBalance,
  getTransactionHistory,
  updateMinimumBalance,
  toggleAutoRecharge,
  getAllAccounts,
  getAccountById,
  freezeAccount,
  unfreezeAccount,
  adjustBalance,
} = require("../controllers/accountController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ─────────────────────────────────────────────────────
//  ACCOUNT ROUTES
//  Base URL: /api/v1/accounts
//
//  WHO CAN DO WHAT:
//  user     → create, view, top-up their own account
//  operator → view accounts
//  admin    → full access including freeze and adjust
// ─────────────────────────────────────────────────────

// ── USER ROUTES ───────────────────────────────────────

// POST /api/v1/accounts/create
// Creates a new wallet for logged in user
// One user can only have one account
router.post("/create", protect, createAccount);

// GET /api/v1/accounts/my-account
// Get logged in user's own wallet details
router.get("/my-account", protect, getMyAccount);

// POST /api/v1/accounts/top-up
// Add money to wallet
// Example: user adds 500 BDT to their wallet
router.post("/top-up", protect, topUpBalance);

// GET /api/v1/accounts/my-account/transactions
// Get transaction history for logged in user's account
router.get(
  "/my-account/transactions",
  protect,
  getTransactionHistory
);

// PUT /api/v1/accounts/minimum-balance
// Update the low balance alert threshold
// Example: user sets alert when balance falls below 300
router.put("/minimum-balance", protect, updateMinimumBalance);

// PUT /api/v1/accounts/auto-recharge
// Enable or disable auto recharge feature
router.put("/auto-recharge", protect, toggleAutoRecharge);

// ── ADMIN + OPERATOR ROUTES ───────────────────────────

// GET /api/v1/accounts
// Get ALL accounts in the system
router.get(
  "/",
  protect,
  authorize("admin", "operator"),
  getAllAccounts
);

// ── ADMIN ONLY ROUTES ─────────────────────────────────

// PUT /api/v1/accounts/:id/freeze
// Freeze an account — admin only
// Example: suspicious activity, fraud detected
router.put(
  "/:id/freeze",
  protect,
  authorize("admin"),
  freezeAccount
);

// PUT /api/v1/accounts/:id/unfreeze
// Unfreeze an account — admin only
router.put(
  "/:id/unfreeze",
  protect,
  authorize("admin"),
  unfreezeAccount
);

// PUT /api/v1/accounts/:id/adjust-balance
// Manually adjust balance — admin only
// Example: refund, correction, compensation
router.put(
  "/:id/adjust-balance",
  protect,
  authorize("admin"),
  adjustBalance
);

// ── INDIVIDUAL ACCOUNT ROUTE ──────────────────────────
// Must come LAST — same reason as vehicle routes
// :id would match other routes if placed first

// GET /api/v1/accounts/:id
// Get single account by id — admin and operator only
router.get(
  "/:id",
  protect,
  authorize("admin", "operator"),
  getAccountById
);

module.exports = router;