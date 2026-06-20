const ApiResponse = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────
//  errorMiddleware.js
//  This is the GLOBAL ERROR CATCHER.
//  Any error thrown ANYWHERE in the app lands here.
//
//  How it works:
//  When you write: throw new Error("Something failed")
//  or:            next(error)
//  Express automatically sends it to this function.
//
//  This replaces the basic error handler we put in
//  app.js temporarily in chunk 2.
// ─────────────────────────────────────────────────────

// ───────────────────────────────────────────────────
//  notFound
//  Handles requests to routes that don't exist
//  Example: GET /api/v1/blahblah → hits this
// ───────────────────────────────────────────────────
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error); // pass to errorHandler below
};

// ───────────────────────────────────────────────────
//  errorHandler
//  The main error handler — must have 4 parameters
//  Express identifies it as error middleware because
//  of the (err, req, res, next) signature
// ───────────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  // Use error's own statusCode or default to 500
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // ─────────────────────────────────────────────────
  //  Handle specific MongoDB/Mongoose error types
  //  These are common errors that need friendly messages
  // ─────────────────────────────────────────────────

  // CastError — invalid MongoDB ID format
  // Example: /api/v1/vehicles/INVALID_ID
  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Duplicate key error — unique field already exists
  // Example: registering with an email already in DB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    statusCode = 400;
    message = `${field} already exists. Please use a different value.`;
  }

  // ValidationError — Mongoose schema validation failed
  // Example: required field missing
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  // JsonWebTokenError — invalid token sent
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token. Please log in again.";
  }

  // TokenExpiredError — token has expired
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your session has expired. Please log in again.";
  }

  // Log error details in development only
  if (process.env.NODE_ENV === "development") {
    console.error(`❌ ERROR: ${message}`);
    console.error(err.stack);
  }

  return ApiResponse.error(res, message, statusCode);
};

module.exports = { notFound, errorHandler };