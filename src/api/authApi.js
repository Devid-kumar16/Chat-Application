import axios from "axios"

const API = "http://localhost:5000/api/users"

export const registerApi = (data) =>
  axios.post(`${API}/register`, data)

export const loginApi = (data) =>
  axios.post(`${API}/login`, data)

export const meApi = (token) =>
  axios.get(`${API}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
