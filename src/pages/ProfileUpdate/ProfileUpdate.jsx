import React, { useState, useContext, useEffect } from "react"
import "./ProfileUpdate.css"
import assets from "../../assets/assets"
import axios from "../../api/axios"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"
import upload from "../../lib/upload"
import { AppContext } from "../../context/AppContext"

const SERVER = "http://localhost:5000"

const ProfileUpdate = () => {
  const navigate = useNavigate()
  const { userData, updateUserInState } = useContext(AppContext)

  const [image, setImage] = useState(null)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [prevImage, setPrevImage] = useState("")
  const [loading, setLoading] = useState(false)

  /* ================= LOAD CURRENT USER DATA ================= */
  useEffect(() => {
    if (!userData) return
    setName(userData.username || userData.name || "")
    setBio(userData.bio || "")
    setPrevImage(userData.avatar || "")
  }, [userData])

  /* ================= UPDATE PROFILE ================= */
  const profileUpdate = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      let avatarPath = prevImage

      // Upload new image if selected
      if (image) {
        avatarPath = await upload(image)
      }

      const res = await axios.put("/users/profile", {
        username: name,
        bio,
        avatar: avatarPath
      })

      // 🔥 Handle both backend response shapes
      const updatedUser = res.data.user || res.data

      if (!updatedUser) {
        throw new Error("Invalid user response from server")
      }

      // Update global state safely
      updateUserInState(updatedUser)

      toast.success("Profile updated successfully")
      navigate("/chat")

    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || "Profile update failed")
    } finally {
      setLoading(false)
    }
  }

  /* ================= AVATAR PREVIEW ================= */
  const previewAvatar = image
    ? URL.createObjectURL(image)
    : prevImage
      ? prevImage.startsWith("http")
        ? prevImage
        : `${SERVER}/${prevImage}`
      : assets.avatar_icon

  return (
    <div className="profile">
      <div className="profile-container">
        <form onSubmit={profileUpdate}>
          <h3>Profile Details</h3>

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

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
          />

          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Your bio"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfileUpdate
