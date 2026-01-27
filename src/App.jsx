import React, { useContext } from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import { AppContext } from "./context/AppContext"

import Login from "./pages/Login/Login"
import Chat from "./pages/Chat/Chat"
import ProfileUpdate from "./pages/ProfileUpdate/ProfileUpdate"
import { ToastContainer } from "react-toastify"

const App = () => {
  const { loadingUser } = useContext(AppContext)

  const token = localStorage.getItem("token")  // ✅ TRUE AUTH CHECK

  if (loadingUser) return <div style={{ textAlign: "center" }}>Loading...</div>

  return (
    <>
      <ToastContainer />
      <Routes>
        {/* If logged in, can't go to login */}
        <Route
          path="/login"
          element={token ? <Navigate to="/chat" /> : <Login />}
        />

        {/* Protected routes */}
        <Route
          path="/chat"
          element={token ? <Chat /> : <Navigate to="/login" />}
        />

        <Route
          path="/profile"
          element={token ? <ProfileUpdate /> : <Navigate to="/login" />}
        />

        {/* Default redirect */}
        <Route
          path="*"
          element={<Navigate to={token ? "/chat" : "/login"} />}
        />
      </Routes>
    </>
  )
}

export default App
