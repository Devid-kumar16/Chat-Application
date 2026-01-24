import axios from "axios"

const API_URL = "http://localhost:5000/api/users"

export const loginApi = (data) =>
  axios.post(`${API_URL}/login`, data)

export const registerApi = (data) =>
  axios.post(`${API_URL}/register`, data)

export const meApi = (token) =>
  axios.get(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
