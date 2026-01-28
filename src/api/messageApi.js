import axios from "axios"

const API = "http://localhost:5000/api/messages"

/* ================= AUTH HEADER ================= */
const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
})

/* ================= SEND MESSAGE ================= */
export const sendMessageApi = (data) => {
  return axios.post(`${API}/send`, data, authHeader())
}

/* ================= GET MESSAGES (BY CHAT) ================= */
export const getMessagesApi = (chatId) => {
  return axios.get(`${API}/${chatId}`, authHeader())
}

/* ================= DELETE MESSAGE ================= */
export const deleteMessageApi = (messageId) => {
  return axios.delete(`${API}/${messageId}`, authHeader())
}

/* ================= EDIT MESSAGE ================= */
export const editMessageApi = (messageId, text) => {
  return axios.put(`${API}/${messageId}`, { text }, authHeader())
}

/* ================= MARK SINGLE MESSAGE READ ================= */
export const markMessageReadApi = (id) => {
  return axios.put(`${API}/read/${id}`, {}, authHeader())
}

/* ================= MARK ALL READ IN CHAT ================= */
export const markMessagesReadApi = (chatId) => {
  return axios.put(`${API}/read-chat/${chatId}`, {}, authHeader())
}
