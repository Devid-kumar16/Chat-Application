import React, { useEffect, useContext, useState, useMemo } from "react"
import "./RightSidebar.css"
import assets from "../../assets/assets"
import { useNavigate } from "react-router-dom"
import { AppContext } from "../../context/AppContext"
import { getSocket } from "../../socket"

const SERVER = "http://localhost:5000"

const RightSidebar = () => {
  const navigate = useNavigate()
  const { users, chatUser, messages, resetAppState } = useContext(AppContext)
  const [media, setMedia] = useState([])

  /* ================= SAFE ACTIVE USER ================= */
const activeUser = useMemo(() => {
  if (!chatUser?.rId) return null
  return users.find(u => u.id === chatUser.rId)
}, [chatUser?.rId, users])


  /* ================= COLLECT MEDIA ================= */
  useEffect(() => {
    if (!Array.isArray(messages)) return setMedia([])

    setMedia(
      messages
        .filter(m => m.media && m.media.trim() !== "")
        .map(m => m.media)
    )
  }, [messages])

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    const socket = getSocket()
    socket?.disconnect()
    localStorage.removeItem("token")
    resetAppState()
    navigate("/login")
  }

  /* ================= AVATAR HELPER ================= */
  const getAvatar = (avatar) => {
    if (!avatar) return assets.profile_img
    return avatar.startsWith("http")
      ? `${avatar}?v=${Date.now()}`
      : `${SERVER}/${avatar}?v=${Date.now()}`
  }

  /* ================= NO CHAT SELECTED ================= */
  if (!activeUser) {
    return (
      <div className="rs">
        <div className="rs-empty">
          {/* <img src={assets.profile_img} alt="" />
          <p>Select a chat to see user info</p> */}
        </div>
        <button onClick={handleLogout}>Logout</button>
      </div>
    )
  }

  /* ================= MAIN UI ================= */
  return (
    <div className="rs">
<div className="rs-profile">
  <div className="rs-avatar">
    <img src={getAvatar(activeUser.avatar)} alt="profile" />
  </div>
  <h3>{activeUser.username}</h3>
  <p>{activeUser.bio || "Hey there 👋"}</p>
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
                  key={`media-${i}`}
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
