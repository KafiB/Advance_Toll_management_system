const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const cookieParser = require("cookie-parser");

// ─────────────────────────────────────────────────────
//  Initialize Express app
// ─────────────────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────────────────
//  SECURITY MIDDLEWARE
// ─────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL
        : "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─────────────────────────────────────────────────────
//  BODY PARSING MIDDLEWARE
//  Must come BEFORE routes so body is available
// ─────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ─────────────────────────────────────────────────────
//  LOGGING MIDDLEWARE
// ─────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─────────────────────────────────────────────────────
//  RATE LIMITER
// ─────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});
app.use("/api", limiter);

// ─────────────────────────────────────────────────────
//  HEALTH CHECK
// ─────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Toll Management System API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────
//  API ROUTES
//  Add new routes here as we build each chunk
// ─────────────────────────────────────────────────────
app.use("/api/v1/auth",     require("./routes/authRoutes"));
app.use("/api/v1/vehicles", require("./routes/vehicleRoutes"));
app.use("/api/v1/accounts", require("./routes/accountRoutes"));
app.use("/api/v1/booths",   require("./routes/boothRoutes"));
app.use("/api/v1/transactions", require("./routes/transactionRoutes"));
app.use("/api/v1/blacklist",    require("./routes/blacklistRoutes"));
app.use("/api/v1/reports",      require("./routes/reportRoutes"));
app.use("/api/v1/messages",     require("./routes/messageRoutes"));

// ─────────────────────────────────────────────────────
//  ERROR HANDLING
//  Must be LAST — after all routes
// ─────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;