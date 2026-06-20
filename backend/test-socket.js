const { io } = require("socket.io-client");

const socket = io("http://localhost:5000", {
  auth: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMmM1NmVhZTNkZmU1OGEzMDY2NDI3NCIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzgxNDQzMzkzLCJleHAiOjE3ODIwNDgxOTN9.h3i5g7v7hBQb_FF4qx1fyWmVlrK9RgdR8Rrw51EPRFE" }
});

socket.on("connect", () => {
  console.log("✅ Connected:", socket.id);
});

socket.on("connect_error", (err) => {
  console.log("❌ Connection error:", err.message);
});

socket.on("user_online", (data) => console.log("User online:", data));
socket.on("receive_message", (data) => console.log("New message:", data));