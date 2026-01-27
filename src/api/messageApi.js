import axios from "axios"

const API = "http://localhost:5000/api/messages"

/* ================= COMMON HEADER ================= */
const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
})

/* ================= SEND MESSAGE ================= */
export const sendMessageApi = (data) => {
  return axios.post(`${API}/send`, data, authHeader())
}

/* ================= GET MESSAGES ================= */
export const getMessagesApi = (chatId) => {
  return axios.get(`${API}/${chatId}`, authHeader())
}

/* ================= DELETE MESSAGE ================= */
export const deleteMessageApi = (messageId) => {
  return axios.delete(`${API}/${messageId}`, authHeader())
}


/* ================= EDIT MESSAGE ================= */
export const editMessageApi = (messageId, text) => {
  return axios.put(
    `${API}/${messageId}`,
    { text },
    authHeader()
  )
}


export const markMessagesReadApi = (chatId) =>
  axios.put(`/api/messages/read-chat/${chatId}`)

// ✅ MARK SINGLE MESSAGE AS READ
export const markMessageReadApi = (id) =>
  axios.put(`/api/messages/read/${id}`)