import React, { useEffect, useContext, useState } from "react"
import "./RightSidebar.css"
import assets from "../../assets/assets"
import { logout } from "../../config/firebase"
import { useNavigate } from "react-router-dom"
import { AppContext } from "../../context/AppContext"

const RightSidebar = () => {
  const navigate = useNavigate()
  const { chatUser, messages } = useContext(AppContext)
  const [media, setMedia] = useState([])

  /* ================= LOAD MEDIA ================= */
  useEffect(() => {
    if (!messages || messages.length === 0) {
      setMedia([])
      return
    }

    const files = messages
      .filter(m => m.image || m.video)
      .map(m => m.image || m.video)

    setMedia(files)
  }, [messages])

  /* ================= NO CHAT SELECTED ================= */
  if (!chatUser) {
    return (
      <div className="rs">
        <button onClick={logout}>Logout</button>
      </div>
    )
  }

  return (
    <div className="rs">
      {/* ================= PROFILE ================= */}
      <div
        className="rs-profile"
        onClick={() => navigate("/profile")}
        style={{ cursor: "pointer" }}
      >
        <img
          src={chatUser.userData.avatar || assets.profile_img}
          alt="profile"
        />
        <h3>
          {Date.now() - chatUser.userData.lastSeen <= 70000 && (
            <img src={assets.green_dot} className="dot" alt="" />
          )}
          {chatUser.userData.name}
        </h3>
        <p>{chatUser.userData.bio}</p>
      </div>

      <hr />

      {/* ================= MEDIA ================= */}
      <div className="rs-media">
        <p>Media</p>

        <div className="rs-media-grid">
          {media.length === 0 ? (
            <span className="no-media">No media shared</span>
          ) : (
            media.map((url, i) =>
              url.endsWith(".mp4") || url.includes("video") ? (
                <video
                  key={i}
                  src={url}
                  onClick={() => window.open(url)}
                  className="media-video"
                />
              ) : (
                <img
                  key={i}
                  src={url}
                  alt=""
                  onClick={() => window.open(url)}
                />
              )
            )
          )}
        </div>
      </div>

      {/* ================= LOGOUT ================= */}
      <button onClick={logout}>Logout</button>
    </div>
  )
}

export default RightSidebar
