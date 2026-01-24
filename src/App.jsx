import React, { useEffect, useContext, useState } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { AppContext } from "./context/AppContext"
import { meApi } from "./api/authApi"

import Login from "./pages/Login/Login"
import Chat from "./pages/Chat/Chat"
import ProfileUpdate from "./pages/ProfileUpdate/ProfileUpdate"
import { ToastContainer } from "react-toastify"

const App = () => {
  const { userData, setUserData } = useContext(AppContext)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      setLoading(false)
      return
    }

    meApi(token)
      .then((res) => setUserData(res.data))
      .catch(() => {
        localStorage.removeItem("token")
        setUserData(null)
      })
      .finally(() => setLoading(false))
  }, [setUserData])

  if (loading) return <div style={{ textAlign: "center" }}>Loading...</div>

  return (
    <>
      <ToastContainer />

      <Routes>
        <Route
          path="/login"
          element={userData ? <Navigate to="/chat" /> : <Login />}
        />
        <Route
          path="/chat"
          element={!userData ? <Navigate to="/login" /> : <Chat />}
        />
        <Route
          path="/profile"
          element={!userData ? <Navigate to="/login" /> : <ProfileUpdate />}
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </>
  )
}

export default App
