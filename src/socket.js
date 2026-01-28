import { io } from "socket.io-client"

let socket = null
let currentUserId = null   // 🔥 store user

export const connectSocket = (userId) => {
  if (!socket) {
    currentUserId = userId

    socket = io("http://localhost:5000", {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    })

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id)

      // 🔥 Tell server user is online
      socket.emit("user-online", currentUserId)
    })

    // 🔥 AUTO REJOIN ROOMS AFTER RECONNECT
    socket.on("reconnect", () => {
      console.log("♻️ Reconnected socket")
      socket.emit("user-online", currentUserId)
    })

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected")
    })
  }

  return socket
}

export const getSocket = () => socket

// Room ID generator
export const getRoomId = (user1, user2) => {
  return [user1, user2].sort().join("_")
}
