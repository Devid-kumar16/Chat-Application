import { io } from "socket.io-client"

let socket = null

export const connectSocket = (userId) => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      transports: ["websocket"],
      reconnection: true
    })

    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id)

      // 🔥 CORRECT EVENT NAME
      socket.emit("user-online", userId)
    })

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected")
    })
  }

  return socket
}

export const getSocket = () => socket
