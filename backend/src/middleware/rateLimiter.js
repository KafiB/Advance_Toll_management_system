const rateLimit = require("express-rate-limit");

// ─────────────────────────────────────────────────────
//  rateLimiter.js
//  Specific rate limiters for sensitive routes.
//  The global limiter in app.js covers all routes.
//  These are stricter limits for critical endpoints.
// ─────────────────────────────────────────────────────

// ───────────────────────────────────────────────────
//  authLimiter
//  Applied to login and register routes only
//  Max 10 attempts per 15 minutes per IP
//  Prevents brute force password attacks
// ───────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // max 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

// ───────────────────────────────────────────────────
//  transactionLimiter
//  Applied to toll transaction routes
//  Max 50 transactions per minute per IP
//  Prevents fake transaction flooding
// ───────────────────────────────────────────────────
const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50,             // max 50 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many transaction requests. Please slow down.",
  },
});

module.exports = { authLimiter, transactionLimiter };