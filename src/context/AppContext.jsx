import { createContext, useState, useEffect, useCallback } from "react"
import axios from "axios"

export const AppContext = createContext(null)

const SERVER = "http://localhost:5000"

const AppContextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null)
  const [users, setUsers] = useState([])
  const [chatData, setChatData] = useState([])
  const [messagesId, setMessagesId] = useState(null)
  const [chatUser, setChatUser] = useState(null) // { rId }
  const [messages, setMessages] = useState([])
  const [chatVisible, setChatVisible] = useState(false)

  const getToken = () => localStorage.getItem("token")

  /* ================= HARD RESET (CRITICAL) ================= */
  const resetAppState = useCallback(() => {
    setUserData(null)
    setUsers([])
    setChatData([])
    setMessagesId(null)
    setChatUser(null)
    setMessages([])
  }, [])

  /* ================= LOAD LOGGED USER ================= */
  const refreshUser = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) return resetAppState()

      const res = await axios.get(`${SERVER}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setUserData(res.data)

      // 🔥 Keep users list in sync with latest profile
      setUsers(prev => {
        const exists = prev.find(u => u.id === res.data.id)
        if (!exists) return prev
        return prev.map(u => u.id === res.data.id ? res.data : u)
      })

    } catch (err) {
      console.error("User load error:", err)
      resetAppState()
    }
  }, [resetAppState])

  /* ================= LOAD ALL USERS ================= */
  const refreshUsers = useCallback(async () => {
    try {
      const token = getToken()
      if (!token) return

      const res = await axios.get(`${SERVER}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setUsers(res.data)
    } catch (err) {
      console.error("Users load error:", err)
    }
  }, [])

  /* ================= LOAD USER CHATS ================= */
  const refreshChats = useCallback(async (id) => {
    try {
      const token = getToken()
      if (!token || !id) return

      const res = await axios.get(`${SERVER}/api/chats/user/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      setChatData(res.data)
    } catch (err) {
      console.error("Chats load error:", err)
    }
  }, [])

  /* ================= APP INIT ================= */
  useEffect(() => {
    const token = getToken()
    if (!token) {
      resetAppState()
      return
    }

    refreshUser()
    refreshUsers()
  }, [refreshUser, refreshUsers, resetAppState])

  /* ================= WHEN USER CHANGES ================= */
  useEffect(() => {
    if (userData?.id) {
      refreshChats(userData.id)
    }
  }, [userData, refreshChats])

  /* ================= HELPERS ================= */
  const getUserById = (id) => users.find(u => u.id === id)

  return (
    <AppContext.Provider value={{
      userData,
      users,
      chatData,
      messagesId,
      chatUser,
      messages,
      chatVisible, 
            
      setChatVisible,
      setUserData,
      setUsers,
      setMessagesId,
      setChatUser,
      setMessages,

      refreshUser,
      refreshUsers,
      getUserById,
      resetAppState
    }}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider
