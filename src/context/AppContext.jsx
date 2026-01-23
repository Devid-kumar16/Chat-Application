// src/context/AppContext.jsx

import { createContext, useState, useEffect, useRef } from "react"
import axios from "axios"

export const AppContext = createContext(null)

const AppContextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null)
  const [chatData, setChatData] = useState([])
  const [messagesId, setMessagesId] = useState(null)
  const [chatUser, setChatUser] = useState(null)
  const [messages, setMessages] = useState([])

  const lastSeenInterval = useRef(null)

  /* ================= LOAD USER (BACKEND) ================= */
  const loadUserData = async (uid) => {
    if (!uid) return

    try {
      const res = await axios.get(
        `http://localhost:5000/api/users/${uid}`
      )

      setUserData(res.data)

      // simulate online heartbeat (optional)
      if (lastSeenInterval.current) clearInterval(lastSeenInterval.current)

      lastSeenInterval.current = setInterval(() => {
        axios.post("http://localhost:5000/api/users/last-seen", {
          userId: uid
        })
      }, 60000)
    } catch (err) {
      console.error("Failed to load user data", err)
    }
  }

  /* ================= LOAD CHAT LIST (BACKEND) ================= */
  useEffect(() => {
    if (!userData?.id) return

    const loadChats = async () => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/chats/${userData.id}`
        )
        setChatData(res.data)
      } catch (err) {
        console.error("Failed to load chats", err)
      }
    }

    loadChats()
  }, [userData?.id])

  return (
    <AppContext.Provider
      value={{
        userData,
        loadUserData,
        chatData,
        messagesId,
        setMessagesId,
        chatUser,
        setChatUser,
        messages,
        setMessages
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider
