import React, { useState } from 'react'
import assets from '../../assets/assets'
import './Login.css'
import { signup, login, resetPass } from '../../config/firebase'
import { toast } from 'react-toastify'

const Login = () => {
  const [currState, setCurrState] = useState("Sign up")
  const [userName, setUserName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const onSubmitHandler = async (event) => {
    event.preventDefault()

    try {
      setLoading(true)

      if (currState === "Sign up") {
        const user = await signup(userName, email, password)
        console.log("Signup success:", user)
      } else {
        const user = await login(email, password)
        console.log("Login success:", user)
      }

    } catch (error) {
      console.error("Auth error:", error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='login'>
      <img src={assets.logo_big} alt="logo" className="logo" />

      <form onSubmit={onSubmitHandler} className='login-form'>
        <h2>{currState}</h2>

        {currState === "Sign up" && (
          <input
            type="text"
            placeholder='Username'
            className="form-input"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder='Email address'
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder='Password'
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
          {currState === "Sign up" ? (
            <p className="login-toggle">
              Already have an account?{" "}
              <span onClick={() => setCurrState("Login")}>Login here</span>
            </p>
          ) : (
            <p className="login-toggle">
              Create an account{" "}
              <span onClick={() => setCurrState("Sign up")}>Click here</span>
            </p>
          )}
          {currState === "Login" ?
            <p className="login-toggle">
              Forgot Password ?
              <span onClick={() => resetPass(email)}>reset here</span>
            </p>:null}
        </div>
      </form>
    </div>
  )
}

export default Login
