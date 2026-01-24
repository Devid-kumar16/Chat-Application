import React, { useContext, useMemo, useState } from "react"
import "./LeftSidebar.css"
import assets from "../../assets/assets"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import socket from "../../socket"
import { AppContext } from "../../context/AppContext"

const SERVER = "http://localhost:5000"

const LeftSidebar = () => {
  const navigate = useNavigate()
  const { userData, users, setChatUser, setMessagesId, setChatVisible } = useContext(AppContext)

  const [search, setSearch] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)

  /* ================= LOGOUT (CRITICAL FIX) ================= */
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    sessionStorage.clear()

    // 🔥 Disconnect socket to prevent user mix
    socket.disconnect()

    // 🔥 Hard reset app
    window.location.replace("/login")
  }

  /* ================= USERS (single source of truth) ================= */
  const otherUsers = useMemo(() => {
    return users.filter(u => u.id !== userData?.id)
  }, [users, userData])

  /* ================= SEARCH ================= */
  const filteredUsers = useMemo(() => {
    return otherUsers.filter(u =>
      (u.username || "").toLowerCase().includes(search.toLowerCase())
    )
  }, [otherUsers, search])

  /* ================= OPEN CHAT ================= */
const openChat = async (user) => {
  try {
    const token = localStorage.getItem("token")

    const res = await axios.post(
      `${SERVER}/api/chats/open`,
      { senderId: userData.id, receiverId: user.id },
      { headers: { Authorization: `Bearer ${token}` } }
    )

    // ✅ 1. Set chat id
    setMessagesId(res.data.chatId)

    // ✅ 2. Set active receiver
    setChatUser({ rId: user.id })

    // ✅ 3. 🔥 SHOW CHAT WINDOW
    setChatVisible(true)

  } catch (err) {
    console.error("Open chat error:", err)
  }
}

  return (
    <div className="ls">
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} className="logo" alt="logo" />

          <div className="menu">
            <img
              src={assets.menu_icon}
              alt="menu"
              onClick={() => setMenuOpen(!menuOpen)}
            />

            {menuOpen && (
              <div className="sub-menu">
                <p onClick={() => navigate("/profile")}>Edit Profile</p>
                <hr />
                <p onClick={handleLogout}>Logout</p>
              </div>
            )}
          </div>
        </div>

        <div className="ls-search">
          <img src={assets.search_icon} alt="search" />
          <input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ================= USER LIST ================= */}
      <div className="ls-list">
        {filteredUsers.length === 0 ? (
          <p className="no-users">No users found</p>
        ) : (
          filteredUsers.map(user => {
            const avatar = user.avatar
              ? user.avatar.startsWith("http")
                ? user.avatar
                : `${SERVER}/${user.avatar}`
              : assets.avatar_icon

            return (
              <div
                key={user.id}
                className="friends"
                onClick={() => openChat(user)}
              >
<img
  src={`${avatar}?v=${user.updated_at || Date.now()}`}
  alt="avatar"
  onError={(e) => (e.target.src = assets.avatar_icon)}
/>

                <p>{user.username}</p>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default LeftSidebar
