import React, { useContext, useState, useEffect, useMemo } from "react"
import "./LeftSidebar.css"
import assets from "../../assets/assets"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import { AppContext } from "../../context/AppContext"
import { searchUsers } from "../../api/userApi"

const SERVER = "http://localhost:5000"

const LeftSidebar = () => {
  const navigate = useNavigate()

  const {
    users,
    userData,
    setChatUser,
    setMessagesId,
    setChatVisible,
    refreshUsers,
    resetAppState,
    lastMessages
  } = useContext(AppContext)

  const [search, setSearch] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)

  /* ================= SAFE USER REFRESH ================= */
  useEffect(() => {
    if (userData?.id) refreshUsers()
  }, [userData?.id])

  /* ================= AVATAR HELPER ================= */
  const getAvatar = (avatar) => {
    if (!avatar) return assets.avatar_icon
    return avatar.startsWith("http")
      ? avatar
      : `${SERVER}/${avatar}`
  }

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("token")
    resetAppState()
    navigate("/login")
  }

  /* ================= SEARCH ================= */
  const handleSearch = async (e) => {
    const value = e.target.value
    setSearch(value)

    if (!value.trim()) return setSearchResults([])

    const token = localStorage.getItem("token")
    const results = await searchUsers(value, token)
    setSearchResults(results)
  }

  /* ================= OPEN CHAT ================= */
  const openChat = async (user) => {
    if (!userData) return

    const res = await axios.post("/api/chats/open", {
      senderId: userData.id,
      receiverId: user.id
    })

    setMessagesId(res.data.chatId)
    setChatUser(user)      // full object
    setChatVisible(true)
  }

  /* ================= USERS LIST ================= */
  const listToShow = useMemo(() => {
    if (search) return searchResults
    return users
  }, [search, searchResults, users])

  return (
    <div className="ls">
      <div className="ls-top">
        <div className="ls-nav">
          <img src={assets.logo} className="logo" alt="" />

          <div className="menu">
            <img
              src={assets.menu_icon}
              onClick={() => setMenuOpen(prev => !prev)}
              alt=""
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

        {/* ================= LOGGED USER PROFILE ================= */}
        {userData && (
          <div
            className="ls-profile"
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
          >
            <img
              src={getAvatar(userData.avatar)}
              alt="profile"
              onError={(e) => (e.target.src = assets.avatar_icon)}
            />
            <p className="username">{userData.username}</p>
          </div>
        )}

        <div className="ls-search">
          <img src={assets.search_icon} alt="" />
          <input
            placeholder="Search users..."
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* ================= CHAT USERS LIST ================= */}
      <div className="ls-list">
        {listToShow.map(user => {
          const lastMsg = lastMessages[user.id]

          return (
            <div
              key={`user-${user.id}`}
              className="friends"
              onClick={() => openChat(user)}
            >
              <div className="friend-avatar">
                <img src={getAvatar(user.avatar)} alt="" />
              </div>

              <div className="friend-info">
                <p className="friend-name">{user.username}</p>
<span className="last-msg">
  {lastMsg
    ? lastMsg.text
      ? lastMsg.text
      : lastMsg.media_type === "image"
        ? "📷 Image"
        : lastMsg.media_type === "file"
          ? "📎 File"
          : ""
    : ""}
</span>

              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default LeftSidebar