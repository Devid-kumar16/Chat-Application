import axios from "axios"

const API = axios.create({
  baseURL: "http://localhost:5000/api/users",
})

export const searchUsers = async (search, token) => {
  const { data } = await API.get(`/search?search=${search}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  return data
}
