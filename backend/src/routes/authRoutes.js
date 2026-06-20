const express = require("express");
const router = express.Router();

// ─────────────────────────────────────────────────────
//  We import these now but the controller file does
//  not exist yet — we create it in the next step.
//  This is intentional — define the routes first
//  so we know exactly what functions we need to build
//  in the controller. This is how big teams work:
//  Routes = CONTRACT
//  Controller = IMPLEMENTATION of that contract
// ─────────────────────────────────────────────────────
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getAllUsers,
  deleteUser,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimiter");

// ─────────────────────────────────────────────────────
//  AUTH ROUTES
//  Base URL: /api/v1/auth
//
//  PUBLIC ROUTES — no token needed
//  PROTECTED ROUTES — must send token in header
// ─────────────────────────────────────────────────────

// ── PUBLIC ROUTES ─────────────────────────────────────

// POST /api/v1/auth/register
// Creates a new user account
// authLimiter → max 10 requests per 15 min per IP
router.post("/register", authLimiter, register);

// POST /api/v1/auth/login
// Logs in a user and returns a JWT token
router.post("/login", authLimiter, login);

// GET /api/v1/auth/verify-email/:token
// Verifies user email using token sent to their email
router.get("/verify-email/:token", verifyEmail);

// POST /api/v1/auth/forgot-password
// Sends password reset email to user
router.post("/forgot-password", authLimiter, forgotPassword);

// PUT /api/v1/auth/reset-password/:token
// Resets password using token from email
router.put("/reset-password/:token", resetPassword);

// ── PROTECTED ROUTES ──────────────────────────────────
// protect middleware runs first on all routes below
// If token is invalid → request never reaches controller

// GET /api/v1/auth/me
// Returns the currently logged in user's profile
router.get("/me", protect, getMe);

// PUT /api/v1/auth/update-profile
// Updates name, phone, address, avatar
router.put("/update-profile", protect, updateProfile);

// PUT /api/v1/auth/change-password
// Changes password — requires old password to confirm
router.put("/change-password", protect, changePassword);

// POST /api/v1/auth/logout
// Logs out the user
router.post("/logout", protect, logout);

// GET /api/v1/auth/users
// Get all users (admin only)
router.get("/users", protect, getAllUsers);

// DELETE /api/v1/auth/users/:id
// Delete/deactivate a user (admin only)
router.delete("/users/:id", protect, deleteUser);

module.exports = router;