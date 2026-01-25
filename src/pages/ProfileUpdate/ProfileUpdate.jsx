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
  const { userData, updateUserInState } = useContext(AppContext)

  const [image, setImage] = useState(null)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [prevImage, setPrevImage] = useState("")

  useEffect(() => {
    if (!userData) return
    setName(userData.username || "")
    setBio(userData.bio || "")
    setPrevImage(userData.avatar || "")
  }, [userData])

  const profileUpdate = async (e) => {
    e.preventDefault()

    try {
      let avatarPath = prevImage

      // upload new image if selected
      if (image) {
        avatarPath = await upload(image)
      }

      const res = await axios.put("/api/users/profile", {
        username: name,
        bio,
        avatar: avatarPath
      })

      // 🔥 Update context WITHOUT refetch
      updateUserInState(res.data.user)

      toast.success("Profile updated")
      navigate("/chat")

    } catch (err) {
      toast.error("Profile update failed")
    }
  }

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

          <button type="submit">Save Profile</button>
        </form>
      </div>
    </div>
  )
}

export default ProfileUpdate
