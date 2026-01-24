import React, { useState, useContext, useRef } from "react"
import assets from "../../assets/assets"
import "./Login.css"
import { toast } from "react-toastify"
import { AppContext } from "../../context/AppContext"
import { useNavigate } from "react-router-dom"
import { loginApi, registerApi } from "../../api/authApi"

const Login = () => {
  const { setUserData } = useContext(AppContext)
  const navigate = useNavigate()

  const requestLock = useRef(false)   // 🔒 HARD LOCK

  const [currState, setCurrState] = useState("Login")
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (e) => {
    e.preventDefault()

    // 🚫 BLOCK DUPLICATE EXECUTION
    if (requestLock.current) return

    requestLock.current = true
    setLoading(true)

    try {
      let res

      if (currState === "Sign up") {
        res = await registerApi({
          username: userName,
          email,
          password
        })
        toast.success("Account created successfully")
      } else {
        res = await loginApi({ email, password })
        toast.success("Login successful")
      }

      localStorage.setItem("token", res.data.token)
      setUserData(res.data.user)

      navigate("/chat")
    } catch (err) {
      toast.error(err.response?.data?.message || "Authentication failed")
      requestLock.current = false  // allow retry if real error
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
          {loading ? "Please wait..." : "Login"}
        </button>

        <div className="login-term">
          <input type="checkbox" required />
          <p>Agree to the terms of use & privacy policy</p>
        </div>

        <p className="login-toggle">
          {currState === "Login" ? (
            <>
              Create an account{" "}
              <span onClick={() => setCurrState("Sign up")}>Click here</span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span onClick={() => setCurrState("Login")}>Login here</span>
            </>
          )}
        </p>
      </form>
    </div>
  )
}

export default Login
