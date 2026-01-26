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
let onlineUsers = []

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id)

  /* ===== USER COMES ONLINE ===== */
  socket.on("user-online", (userId) => {
    socket.userId = userId

    if (!onlineUsers.includes(userId)) {
      onlineUsers.push(userId)
    }

    io.emit("online-users", onlineUsers)
    console.log("🟢 Online Users:", onlineUsers)
  })

  /* ===== JOIN CHAT ROOM ===== */
  socket.on("join-chat", ({ chatId }) => {
    if (!chatId) return
    const room = `chat_${chatId}`
    socket.join(room)
    console.log(`📥 Joined ${room}`)
  })

  /* ===== LEAVE CHAT ROOM ===== */
  socket.on("leave-chat", (chatId) => {
    if (!chatId) return
    const room = `chat_${chatId}`
    socket.leave(room)
    console.log(`📤 Left ${room}`)
  })

  /* ===== SEND MESSAGE ===== */
  socket.on("send-message", ({ chatId, message }) => {
    if (!chatId || !message) return
    const room = `chat_${chatId}`
    socket.to(room).emit("receive-message", message)
  })

  /* ===== USER DISCONNECT ===== */
  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id)

    if (socket.userId) {
      onlineUsers = onlineUsers.filter(id => id !== socket.userId)
      io.emit("online-users", onlineUsers)
      console.log("🟡 Online Users:", onlineUsers)
    }
  })
})

// ================= START SERVER =================
const PORT = process.env.PORT || 5000

server.listen(PORT, () => {
  console.log(` Backend running on http://localhost:${PORT}`)
})
