import axios from "axios"

const API = "http://localhost:5000/api/messages"

export const sendMessageApi = (data) =>
  axios.post(`${API}/send`, data)

export const getMessagesApi = (chatId) =>
  axios.get(`${API}/${chatId}`)
