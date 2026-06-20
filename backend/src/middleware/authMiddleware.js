const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const ApiResponse = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────
//  authMiddleware.js
//  Two guards that protect our routes:
//
//  1. protect     — checks if user is logged in
//  2. authorize   — checks if user has required role
//
//  Usage in routes:
//  router.get("/profile", protect, getProfile)
//  router.delete("/user", protect, authorize("admin"), deleteUser)
// ─────────────────────────────────────────────────────

// ───────────────────────────────────────────────────
//  protect
//  Verifies the JWT token sent in the request header
//  If valid → attaches user to req.user and continues
//  If invalid → rejects the request immediately
// ───────────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    let token;

    // Token must be sent in Authorization header like:
    // Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
    // Check Authorization header first
if (
  req.headers.authorization &&
  req.headers.authorization.startsWith("Bearer")
) {
  token = req.headers.authorization.split(" ")[1];
}

// If no header token — check cookie
// This allows both Postman (header) and
// browser (cookie) to work at the same time
if (!token && req.cookies && req.cookies.token) {
  token = req.cookies.token;
}

    // No token found — reject immediately
    if (!token) {
      return ApiResponse.error(
        res,
        "Access denied. Please log in to continue.",
        401
      );
    }

    // Verify the token using our secret key
    // If token was tampered with → throws JsonWebTokenError
    // If token expired → throws TokenExpiredError
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user from DB using id stored in token
    // We use select("-password") to never load password into memory
    const user = await User.findById(decoded.id).select("-password");

    // User might have been deleted after token was issued
    if (!user) {
      return ApiResponse.error(
        res,
        "User no longer exists. Please log in again.",
        401
      );
    }

    // Check if user account is active
    if (!user.isActive) {
      return ApiResponse.error(
        res,
        "Your account has been deactivated. Contact support.",
        403
      );
    }

    // Attach user to request object
    // Now every controller can access req.user
    req.user = user;

    next(); // move to the next middleware or controller
  } catch (error) {
    next(error); // send to errorHandler
  }
};

// ───────────────────────────────────────────────────
//  authorize
//  Checks if the logged-in user has the required role
//  Must always be used AFTER protect middleware
//
//  Usage:
//  authorize("admin")            — only admin
//  authorize("admin","operator") — admin or operator
// ───────────────────────────────────────────────────
const authorize = (...roles) => {
  return (req, res, next) => {
    // req.user is set by protect middleware above
    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        `Access denied. Required role: ${roles.join(" or ")}. Your role: ${req.user.role}`,
        403
      );
    }
    next();
  };
};

module.exports = { protect, authorize };