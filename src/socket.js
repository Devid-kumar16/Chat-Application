import { io } from "socket.io-client"

let socket

export const connectSocket = (userId) => {
  if (!socket) {
    socket = io("http://localhost:5000", {
      transports: ["websocket"],
      reconnection: true
    })

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id)
      socket.emit("user-connected", userId)
    })
  }
  return socket
}

export const getSocket = () => socket
