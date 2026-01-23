// src/pages/Login/Login.jsx

import React, { useState, useContext } from "react"
import assets from "../../assets/assets"
import "./Login.css"
import axios from "axios"
import { toast } from "react-toastify"
import { AppContext } from "../../context/AppContext"
import { useNavigate } from "react-router-dom"

const Login = () => {
  const { setUserData } = useContext(AppContext)
  const navigate = useNavigate()

  const [currState, setCurrState] = useState("Login")
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    if (loading) return

    try {
      setLoading(true)

      const url =
        currState === "Sign up"
          ? "http://localhost:5000/api/auth/register"
          : "http://localhost:5000/api/auth/login"

      const payload =
        currState === "Sign up"
          ? { name: userName, email, password }
          : { email, password }

      const res = await axios.post(url, payload)

      // 🔐 store token
      localStorage.setItem("token", res.data.token)

      // 👤 store user
      setUserData(res.data.user)

      toast.success(
        currState === "Sign up"
          ? "Account created successfully"
          : "Login successful"
      )

      navigate("/chat")
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Authentication failed"
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <img src={assets.logo_big} alt="logo" className="logo" />

      <form onSubmit={onSubmitHandler} className="login-form">
        <h2>{currState}</h2>

        {currState === "Sign up" && (
          <input
            type="text"
            placeholder="Username"
            className="form-input"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading
            ? "Please wait..."
            : currState === "Sign up"
            ? "Create Account"
            : "Login"}
        </button>

        <div className="login-term">
          <input type="checkbox" required />
          <p>Agree to the terms of use & privacy policy</p>
        </div>

        <div className="login-forgot">
          {currState === "Login" ? (
            <p className="login-toggle">
              Create an account{" "}
              <span onClick={() => setCurrState("Sign up")}>
                Click here
              </span>
            </p>
          ) : (
            <p className="login-toggle">
              Already have an account?{" "}
              <span onClick={() => setCurrState("Login")}>
                Login here
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  )
}

export default Login
