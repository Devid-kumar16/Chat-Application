import { io } from "socket.io-client"

let socket = null
let currentUserId = null

export const connectSocket = (userId) => {
  // 🔥 If socket already exists and connected → reuse it
  if (socket && socket.connected) {
    return socket
  }

  // 🔥 If socket exists but disconnected → remove old listeners
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
  }

  currentUserId = userId

  socket = io("http://localhost:5000", {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
  })

  socket.on("connect", () => {
    console.log("🟢 Socket connected:", socket.id)
    socket.emit("user-online", currentUserId)
  })

  socket.on("disconnect", (reason) => {
    console.log("🔴 Socket disconnected:", reason)
  })

  socket.on("reconnect", () => {
    console.log("♻️ Reconnected socket")
    socket.emit("user-online", currentUserId)
  })

  return socket
}

export const getSocket = () => socket

// 🔥 Proper cleanup (call on logout)
export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
    currentUserId = null
  }
}

// Room ID generator
export const getRoomId = (user1, user2) => {
  return [user1, user2].sort().join("_")
}
