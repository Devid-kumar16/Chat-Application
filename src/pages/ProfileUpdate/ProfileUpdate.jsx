import React, { useEffect, useState, useContext } from 'react'
import './ProfileUpdate.css'
import assets from '../../assets/assets'

import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { toast } from 'react-toastify'

import { db, auth } from '../../config/firebase'
import { useNavigate } from 'react-router-dom'
import upload from '../../lib/upload'
import { AppContext } from '../../context/AppContext'

const ProfileUpdate = () => {
  const navigate = useNavigate()

  const { setUserData } = useContext(AppContext) // ✅ FIXED

  const [image, setImage] = useState(false)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [uid, setUid] = useState("")
  const [prevImage, setPrevImage] = useState("")

  const profileUpdate = async (event) => {
    event.preventDefault()

    try {
      if (!prevImage && !image) {
        toast.error("Upload profile picture")
        return
      }

      const docRef = doc(db, 'users', uid)

      if (image) {
        const imgUrl = await upload(image)
        setPrevImage(imgUrl)

        await updateDoc(docRef, {
          avatar: imgUrl,
          name,
          bio
        })
      } else {
        await updateDoc(docRef, {
          name,
          bio
        })
      }

      const snap = await getDoc(docRef)
      setUserData(snap.data())

      navigate('/chat')

    } catch (error) {
      console.error(error)
      toast.error(error.message)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid)

        const docRef = doc(db, "users", user.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()

          if (data.name) setName(data.name)
          if (data.bio) setBio(data.bio)
          if (data.avatar) setPrevImage(data.avatar)
        }
      } else {
        navigate('/')
      }
    })

    return () => unsubscribe()
  }, [navigate])

  return (
    <div className='profile'>
      <div className='profile-container'>
        <form onSubmit={profileUpdate}>
          <h3>Profile Details</h3>

          <label htmlFor="avatar">
            <input
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
              onChange={(e) => setImage(e.target.files[0])}
            />

            <img
              src={
                image
                  ? URL.createObjectURL(image)
                  : prevImage || assets.avatar_icon
              }
              alt="avatar"
            />
            Upload profile image
          </label>

          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <textarea
            placeholder="Write profile bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            required
          ></textarea>

          <button type="submit">Save Profile</button>
        </form>

        <img
          className="profile-pic"
          src={
            image
              ? URL.createObjectURL(image)
              : prevImage || assets.logo_icon
          }
          alt="profile"
        />
      </div>
    </div>
  )
}

export default ProfileUpdate
