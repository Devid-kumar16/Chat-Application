const express = require("express")
const cors = require("cors")
const http = require("http")
const { Server } = require("socket.io")
require("dotenv").config()

// ================= ROUTES =================
const userRoutes = require("./routes/userRoutes")
const messageRoutes = require("./routes/messageRoutes")
const chatRoutes = require("./routes/chatRoutes")
const uploadRoutes = require("./routes/uploadRoutes")

// ================= APP & SERVER =================
const app = express()
const server = http.createServer(app)

// ================= CORS =================
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}

app.use(cors(corsOptions))
app.use(express.json())

// ================= SOCKET.IO =================
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket"]
})

app.set("io", io)

// ================= API ROUTES =================
app.use("/api/users", userRoutes)
app.use("/api/messages", messageRoutes)
app.use("/api/chats", chatRoutes)
app.use("/api/upload", uploadRoutes)
app.use("/uploads", express.static("uploads"))

/* ===================================================
   🔥 ONLINE USERS TRACKING
=================================================== */
const onlineUsers = new Map() // userId -> socketId

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id)

  /* ===== USER ONLINE ===== */
  socket.on("user-online", (userId) => {
    socket.userId = userId
    onlineUsers.set(userId, socket.id)
    io.emit("online-users", [...onlineUsers.keys()])
  })

  /* ===== JOIN CHAT ROOM ===== */
  socket.on("join-chat", ({ chatId }) => {
    if (!chatId) return
    socket.join(`chat_${chatId}`)
    console.log(`📥 Joined chat_${chatId}`)
  })

  /* ===== LEAVE CHAT ROOM ===== */
  socket.on("leave-chat", (chatId) => {
    socket.leave(`chat_${chatId}`)
  })

  /* ===== SEND MESSAGE (REALTIME) ===== */
  socket.on("send-message", ({ chatId, message }) => {
    if (!chatId || !message) return
    io.to(`chat_${chatId}`).emit("receive-message", message)
  })

  /* ===== MESSAGE READ (TICKS) ===== */
  socket.on("mark-read", ({ chatId, messageId }) => {
    io.to(`chat_${chatId}`).emit("message-read", { messageId })
  })

  /* ===== MESSAGE EDIT ===== */
  socket.on("message-edited", ({ chatId, messageId, text }) => {
    io.to(`chat_${chatId}`).emit("message-edited", { messageId, text })
  })

  /* ===== MESSAGE DELETE ===== */
  socket.on("message-deleted", ({ chatId, messageId }) => {
    io.to(`chat_${chatId}`).emit("message-deleted", { messageId })
  })

  /* ===== USER DISCONNECT ===== */
  socket.on("disconnect", () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId)
      io.emit("online-users", [...onlineUsers.keys()])
    }
    console.log("🔴 Socket disconnected:", socket.id)
  })
})

// ================= START SERVER =================
const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
})
