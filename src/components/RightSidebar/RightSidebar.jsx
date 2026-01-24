import React, { useEffect, useContext, useState } from "react"
import "./RightSidebar.css"
import assets from "../../assets/assets"
import { useNavigate } from "react-router-dom"
import socket from "../../socket"
import { AppContext } from "../../context/AppContext"

const SERVER = "http://localhost:5000"

const RightSidebar = () => {
  const navigate = useNavigate()

  // ✅ FIX: get users also
  const { chatUser, messages, userData, users, getUserById } = useContext(AppContext)

  const [media, setMedia] = useState([])

  /* ================= SAFE LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    sessionStorage.clear()
    socket.disconnect()
    window.location.replace("/login")
  }

  /* ================= ACTIVE CHAT USER ================= */
  const activeUser = chatUser?.rId
    ? getUserById(chatUser.rId) || users.find(u => u.id === chatUser.rId)
    : null

  /* ================= LOAD MEDIA ================= */
  useEffect(() => {
    if (!Array.isArray(messages)) {
      setMedia([])
      return
    }

    const files = messages
      .filter(m => m.media && m.media.trim() !== "")
      .map(m => m.media)

    setMedia(files)
  }, [messages])

  /* ================= NO CHAT SELECTED ================= */
  if (!activeUser) {
    return (
      <div className="rs">
        <button onClick={handleLogout}>Logout</button>
      </div>
    )
  }

  /* ================= AVATAR FIX ================= */
  const avatarUrl = activeUser.avatar
    ? activeUser.avatar.startsWith("http")
      ? activeUser.avatar
      : `${SERVER}/${activeUser.avatar}`
    : assets.profile_img

  return (
    <div className="rs">

      <div
        className="rs-profile"
        onClick={() => navigate("/profile")}
        style={{ cursor: "pointer" }}
      >
<img
  src={`${avatarUrl}?v=${activeUser?.updated_at || Date.now()}`}
  alt="profile"
  onError={(e) => (e.target.src = assets.profile_img)}
/>
        <h3>{activeUser.username}</h3>
        <p>{activeUser.bio || "Hey there!"}</p>
      </div>

      <hr />

      <div className="rs-media">
        <p>Media</p>
        <div className="rs-media-grid">
          {media.length === 0 ? (
            <span className="no-media">No media shared</span>
          ) : (
            media.map((url, i) => {
              const fullUrl = url.startsWith("http") ? url : `${SERVER}/${url}`

              return (
                <img
                  key={i}
                  src={fullUrl}
                  alt="media"
                  onClick={() => window.open(fullUrl)}
                  onError={(e) => (e.target.style.display = "none")}
                />
              )
            })
          )}
        </div>
      </div>

      <button onClick={handleLogout}>Logout</button>
    </div>
  )
}

export default RightSidebar
