import React, { useState, useContext, useEffect } from "react"
import "./ProfileUpdate.css"
import assets from "../../assets/assets"
import axios from "axios"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"
import upload from "../../lib/upload"
import { AppContext } from "../../context/AppContext"

const SERVER = "http://localhost:5000"

const ProfileUpdate = () => {
  const navigate = useNavigate()
  const { userData, refreshUser, refreshUsers } = useContext(AppContext)

  const [image, setImage] = useState(null)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [prevImage, setPrevImage] = useState("")

  /* LOAD USER DATA INTO FORM */
  useEffect(() => {
    if (userData) {
      setName(userData.username || "")
      setBio(userData.bio || "")
      setPrevImage(userData.avatar || "")
    }
  }, [userData])

  /* ================= UPDATE PROFILE ================= */
  const profileUpdate = async (e) => {
    e.preventDefault()

    try {
      let avatarUrl = prevImage

      /* UPLOAD NEW IMAGE */
      if (image) {
        const res = await upload(image) // returns { fileUrl }
        avatarUrl = res.fileUrl
      }

      const token = localStorage.getItem("token")

      await axios.put(
        `${SERVER}/api/users/profile`,
        { username: name, bio, avatar: avatarUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      /* 🔥 REFRESH GLOBAL DATA (THIS FIXES SIDEBAR + CHAT HEADER) */
      await refreshUser()
      await refreshUsers()

      toast.success("Profile updated successfully")
      navigate("/chat")

    } catch (err) {
      console.error(err)
      toast.error("Profile update failed")
    }
  }

  /* ================= AVATAR PREVIEW ================= */
  const previewAvatar = image
    ? URL.createObjectURL(image)
    : prevImage
      ? prevImage.startsWith("http")
        ? `${prevImage}?t=${Date.now()}`
        : `${SERVER}/${prevImage}?t=${Date.now()}`
      : assets.avatar_icon

  return (
    <div className="profile">
      <div className="profile-container">
        <form onSubmit={profileUpdate}>
          <h3>Profile Details</h3>

          {/* ===== Avatar Upload ===== */}
          <label htmlFor="avatarInput" className="avatar-label">
            <img src={previewAvatar} alt="avatar" />
          </label>

          <input
            id="avatarInput"
            type="file"
            hidden
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
          />

          {/* ===== Name ===== */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />

          {/* ===== Bio ===== */}
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Your bio"
            required
          />

          <button type="submit">Save Profile</button>
        </form>
      </div>
    </div>
  )
}

export default ProfileUpdate
