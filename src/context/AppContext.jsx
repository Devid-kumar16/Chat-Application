import { createContext, useState, useEffect, useCallback } from "react"
import axios from "axios"

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
  const [messagesId, setMessagesId] = useState(null)
  const [chatUser, setChatUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [chatVisible, setChatVisible] = useState(false)

  /* ================= RESET ================= */
  const resetAppState = () => {
    setUserData(null)
    setUsers([])
    setMessagesId(null)
    setChatUser(null)
    setMessages([])
    setChatVisible(false)
  }

  /* ================= GET LOGGED USER ================= */
const refreshUser = useCallback(async () => {
  try {
    const res = await axios.get("/api/users/me")
    setUserData(res.data)
  } catch (err) {
    // ❌ DO NOT LOGOUT if token exists but request fails
    if (!localStorage.getItem("token")) {
      resetAppState()
    }
  }
}, [])


  /* ================= GET USERS ================= */
  const refreshUsers = useCallback(async () => {
    try {
      const res = await axios.get("/api/users")
      const filtered = res.data.filter(u => u.id !== userData?.id)
      setUsers(filtered)
    } catch {}
  }, [userData?.id])

  /* ================= FIND USER ================= */
  const getUserById = (id) => {
    return users.find(u => u.id === id)
  }

  /* ================= UPDATE PROFILE ================= */
  const updateUserInState = (updatedUser) => {
    setUserData(updatedUser)
  }

  useEffect(() => { refreshUser() }, [])
  useEffect(() => { if (userData) refreshUsers() }, [userData])

  return (
    <AppContext.Provider value={{
      userData,
      setUserData,
      users,
      messagesId, setMessagesId,
      chatUser, setChatUser,
      messages, setMessages,
      chatVisible, setChatVisible,
      refreshUser,
      refreshUsers,
      resetAppState,
      getUserById,          // 🔥 FIX 1
      updateUserInState     // 🔥 FIX 2
    }}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider
