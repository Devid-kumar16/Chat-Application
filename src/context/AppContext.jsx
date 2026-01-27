import { createContext, useState, useEffect, useCallback } from "react"
import axios from "axios"
import { connectSocket } from "../socket"

export const AppContext = createContext()
const SERVER = "http://localhost:5000"

axios.defaults.baseURL = SERVER
axios.interceptors.request.use(config => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const normalizeUser = (u) => ({
  ...u,
  id: u.id || u._id
})

const AppContextProvider = ({ children }) => {

  const [userData, setUserData] = useState(null)
  const [loadingUser, setLoadingUser] = useState(true)
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
    const token = localStorage.getItem("token")

    if (!token) {
      resetAppState()
      setLoadingUser(false)
      return
    }

    try {
      const res = await axios.get("/api/users/me")
      setUserData(normalizeUser(res.data))
    } catch (err) {
      console.log("User refresh failed")
    } finally {
      setLoadingUser(false)
    }
  }, [])

  /* ================= LOAD USERS ================= */
  const refreshUsers = useCallback(async () => {
    try {
      const res = await axios.get("/api/users")

      const normalizedUsers = res.data.map(normalizeUser)
      const myId = userData?.id

      setUsers(normalizedUsers.filter(u => u.id !== myId))
    } catch (err) {
      console.log("Failed to load users")
    }
  }, [userData])

  /* ================= TRACK LAST MESSAGE ================= */
  useEffect(() => {
    if (!chatUser || !messages.length) return
    const lastMsg = messages[messages.length - 1]
    setLastMessages(prev => ({ ...prev, [chatUser.id]: lastMsg }))
  }, [messages, chatUser])

  /* ================= SOCKET ================= */
  useEffect(() => {
    if (!userData?.id) return

    const socket = connectSocket(userData.id)
    socket.emit("user-online", userData.id)

    const handleOnline = (ids) => {
  setOnlineUsers(ids.map(id => Number(id)))
}

    socket.on("online-users", handleOnline)

    return () => socket.off("online-users", handleOnline)
  }, [userData?.id])

  /* ================= SAFE PROFILE UPDATE ================= */
  const updateUserInState = (updatedUser) => {
    if (!updatedUser) return

    const normalized = normalizeUser(updatedUser)

    // Update logged-in user
    setUserData(prev => prev?.id === normalized.id ? normalized : prev)

    // Update sidebar users list
    setUsers(prev =>
      prev.map(u => u.id === normalized.id ? normalized : u)
    )

    // Update active chat user
    setChatUser(prev =>
      prev?.id === normalized.id ? normalized : prev
    )
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
      resetAppState,
      loadingUser
    }}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider
