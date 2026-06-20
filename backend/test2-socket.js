const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
  auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMmM1NmVhZTNkZmU1OGEzMDY2NDI3NCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzgxNDQzMzkzLCJleHAiOjE3ODIwNDgxOTN9.h3i5g7v7hBQb_FF4qx1fyWmVlrK9RgdR8Rrw51EPRFE" }
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);

  // Send a test message
  socket.emit("send_message", {
    conversationId: "PASTE_CONVERSATION_ID_HERE",
    content: "Hello, this is a test message!"
  }, (response) => {
    console.log("Send result:", response);
  });
});

socket.on("connect_error", (err) => {
  console.log("❌ Connection error:", err.message);
});

socket.on("receive_message", (data) => console.log("📩 New message:", data));
socket.on("user_online", (data) => console.log("🟢 User online:", data));
socket.on("user_offline", (data) => console.log("🔴 User offline:", data));