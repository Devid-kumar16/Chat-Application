import React, { useEffect, useContext, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

import Login from './pages/Login/Login'
import Chat from './pages/Chat/Chat'
import ProfileUpdate from './pages/ProfileUpdate/ProfileUpdate'

import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './config/firebase'

import { AppContext } from './context/AppContext'

const App = () => {
  const location = useLocation()

  const {
    userData,
    setUserData,
    loadUserData
  } = useContext(AppContext)

  const [authChecked, setAuthChecked] = useState(false)
  const [profileComplete, setProfileComplete] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserData(user)

        // 🔥 LOAD PROFILE DATA
        const profile = await loadUserData(user.uid)

        // profileComplete is decided HERE
        if (profile?.name && profile?.avatar) {
          setProfileComplete(true)
        } else {
          setProfileComplete(false)
        }
      } else {
        setUserData(null)
        setProfileComplete(false)
      }

      setAuthChecked(true)
    })

    return () => unsubscribe()
  }, [setUserData, loadUserData])

  // ⛔ WAIT until auth + profile check finishes
  if (!authChecked) return null

  return (
    <>
      <ToastContainer />

      <Routes>
        {/* DEFAULT */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* LOGIN */}
        <Route
          path="/login"
          element={
            userData
              ? <Navigate to="/chat" replace />
              : <Login />
          }
        />

        {/* PROFILE (ALWAYS ALLOWED FOR LOGGED-IN USERS) */}
        <Route
          path="/profile"
          element={
            !userData
              ? <Navigate to="/login" replace />
              : <ProfileUpdate />
          }
        />

        {/* CHAT (ONLY IF PROFILE COMPLETE) */}
        <Route
          path="/chat"
          element={
            !userData
              ? <Navigate to="/login" replace />
              : profileComplete
                ? <Chat />
                : <Navigate to="/profile" replace />
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default App
