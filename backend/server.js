const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const initializeSocket = require("./src/socket/socketHandler");

process.on("uncaughtException", (err) => {
  console.error("💥 UNCAUGHT EXCEPTION — Shutting down...");
  console.error(`${err.name}: ${err.message}`);
  process.exit(1);
});

const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;
  const NODE_ENV = process.env.NODE_ENV || "development";

  // ── Create HTTP server manually ────────────────────
  // We need this because Socket.IO attaches to the
  // raw HTTP server, not directly to Express
  const httpServer = http.createServer(app);

  // ── Attach Socket.IO to the HTTP server ────────────
  const io = new Server(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.FRONTEND_URL
          : "http://localhost:3000",
      credentials: true,
    },
  });

  // ── Initialize all socket event handlers ───────────
  initializeSocket(io);

  // ── Start listening using httpServer, NOT app ──────
  const server = httpServer.listen(PORT, () => {
    console.log("─────────────────────────────────────────");
    console.log(`🚀 Server running in ${NODE_ENV} mode`);
    console.log(`🌐 URL     : http://localhost:${PORT}`);
    console.log(`📡 API Base: http://localhost:${PORT}/api/v1`);
    console.log(`💬 Socket.IO ready for real-time chat`);
    console.log("─────────────────────────────────────────");
  });

  process.on("unhandledRejection", (err) => {
    console.error("💥 UNHANDLED REJECTION — Shutting down...");
    console.error(`${err.name}: ${err.message}`);

    server.close(() => {
      process.exit(1);
    });
  });
};

startServer();