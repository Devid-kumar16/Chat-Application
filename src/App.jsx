import React, { useContext } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { AppContext } from "./context/AppContext"

import Login from "./pages/Login/Login"
import Chat from "./pages/Chat/Chat"
import ProfileUpdate from "./pages/ProfileUpdate/ProfileUpdate"
import { ToastContainer } from "react-toastify"

const App = () => {
  const { userData, loadingUser } = useContext(AppContext)

  if (loadingUser) return <div style={{textAlign:"center"}}>Loading...</div>

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={userData ? <Navigate to="/chat" /> : <Login />} />
        <Route path="/chat" element={!userData ? <Navigate to="/login" /> : <Chat />} />
        <Route path="/profile" element={!userData ? <Navigate to="/login" /> : <ProfileUpdate />} />
        <Route path="*" element={<Navigate to={userData ? "/chat" : "/login"} />} />
      </Routes>
    </>
  )
}

export default App
