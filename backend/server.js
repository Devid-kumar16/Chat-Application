// backend/server.js

const express = require("express")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")
require("dotenv").config()

// ================= ROUTES =================
const userRoutes = require("./routes/userRoutes")
const messageRoutes = require("./routes/messageRoutes")
const chatRoutes = require("./routes/chatRoutes")

// ================= APP & SERVER =================
const app = express()
const server = http.createServer(app)

// ================= CORS CONFIG =================
const corsOptions = {
  origin: "http://localhost:5173", // ✅ Vite frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket"] // ✅ avoids polling issues
})

// Make io accessible if needed later
app.set("io", io)

// ================= API ROUTES =================
app.use("/api/users", userRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/chats", chatRoutes)
const uploadRoutes = require("./routes/uploadRoutes")

app.use("/api/upload", uploadRoutes)
app.use("/uploads", express.static("uploads"))

// ================= SOCKET EVENTS =================
io.on("connection", (socket) => {
  console.log("🔌 Socket connected:", socket.id)

  // Join a chat room
  socket.on("join-chat", (chatId) => {
    if (!chatId) return
    socket.join(`chat_${chatId}`)
    console.log(`📥 Joined chat_${chatId}`)
  })

  // Relay message to other users in the room
  socket.on("send-message", ({ chatId, message }) => {
    if (!chatId || !message) return
    socket.to(`chat_${chatId}`).emit("receive-message", message)
  })

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id)
  })
})

// ================= START SERVER =================
const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
})
