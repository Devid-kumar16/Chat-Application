import { createContext, useState, useEffect, useCallback } from "react"
import axios from "axios"
import { connectSocket, getSocket } from "../socket"

export const AppContext = createContext()
const SERVER = "http://localhost:5000"

axios.defaults.baseURL = SERVER
axios.interceptors.request.use(config => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const AppContextProvider = ({ children }) => {

  const [userData, setUserData] = useState(null)
  const [users, setUsers] = useState([])
  const [chatUser, setChatUser] = useState(null)
  const [messagesId, setMessagesId] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatVisible, setChatVisible] = useState(false)
  const [lastMessages, setLastMessages] = useState({})
  const [onlineUsers, setOnlineUsers] = useState([])

  const resetAppState = () => {
    setUserData(null)
    setUsers([])
    setMessagesId(null)
    setChatUser(null)
    setMessages([])
    setChatVisible(false)
    setLastMessages({})
    setOnlineUsers([])
  }

  /* ================= LOAD AUTH USER ================= */
  const refreshUser = useCallback(async () => {
    try {
      const res = await axios.get("/api/users/me")
      setUserData(res.data)
    } catch {
      if (!localStorage.getItem("token")) resetAppState()
    }
  }, [])

  /* ================= LOAD USERS ================= */
  const refreshUsers = useCallback(async () => {
    try {
      const res = await axios.get("/api/users")
      setUsers(res.data.filter(u => u.id !== userData?.id))
    } catch {}
  }, [userData?.id])

  /* ================= TRACK LAST MESSAGE ================= */
  useEffect(() => {
    if (!chatUser || !messages.length) return
    const lastMsg = messages[messages.length - 1]
    setLastMessages(prev => ({ ...prev, [chatUser.id]: lastMsg }))
  }, [messages, chatUser])

  /* ===================================================
     🟢 SOCKET + ONLINE USERS (FIXED)
  =================================================== */
  useEffect(() => {
    if (!userData?.id) return

    // 1️⃣ Ensure socket exists
    const socket = connectSocket(userData.id)

    // 2️⃣ Tell server user is online
    socket.emit("user-online", userData.id)

    // 3️⃣ Listen to online list
    const handleOnline = (ids) => {
      setOnlineUsers(ids)
    }

    socket.on("online-users", handleOnline)

    return () => socket.off("online-users", handleOnline)
  }, [userData?.id])

  const updateUserInState = (updatedUser) => {
    setUserData(updatedUser)
  }

  useEffect(() => { refreshUser() }, [])
  useEffect(() => { if (userData) refreshUsers() }, [userData])

  return (
    <AppContext.Provider value={{
      userData, setUserData, updateUserInState,
      users, refreshUsers,
      chatUser, setChatUser,
      messagesId, setMessagesId,
      messages, setMessages,
      chatVisible, setChatVisible,
      lastMessages,
      onlineUsers,
      refreshUser,
      resetAppState
    }}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider
