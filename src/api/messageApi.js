import axios from "axios"

const API = "http://localhost:5000/api/messages"

/* ================= SEND MESSAGE ================= */
export const sendMessageApi = (data) => {
  const token = localStorage.getItem("token")

  return axios.post(`${API}/send`, data, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}

/* ================= GET MESSAGES ================= */
export const getMessagesApi = (chatId) => {
  const token = localStorage.getItem("token")

  return axios.get(`${API}/${chatId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
}
