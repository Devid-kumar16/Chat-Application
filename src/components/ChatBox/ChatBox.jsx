import React, { useEffect, useContext, useState, useRef, useMemo } from "react"
import "./ChatBox.css"
import assets from "../../assets/assets"
import { AppContext } from "../../context/AppContext"
import upload from "../../lib/upload"
import { toast } from "react-toastify"
import EmojiPicker from "emoji-picker-react"
import { sendMessageApi, getMessagesApi } from "../../api/messageApi"
import { connectSocket, getSocket } from "../../socket"

const SERVER = "http://localhost:5000"

const ChatBox = () => {
  const {
    userData,
    users,
    messagesId,
    chatUser,
    messages = [],
    setMessages,
    chatVisible,
    setChatVisible
  } = useContext(AppContext)

  const [input, setInput] = useState("")
  const [showEmoji, setShowEmoji] = useState(false)
  const endRef = useRef(null)

  /* ================= CONNECT SOCKET (ONCE) ================= */
  useEffect(() => {
    if (userData?.id) connectSocket(userData.id)
  }, [userData?.id])

  /* ================= ACTIVE CHAT USER ================= */
  const activeChatUser = useMemo(() => {
    if (!chatUser?.rId || !Array.isArray(users)) return null
    return users.find(u => u.id === chatUser.rId) || null
  }, [chatUser?.rId, users])

  const avatarUrl = activeChatUser?.avatar
    ? activeChatUser.avatar.startsWith("http")
      ? activeChatUser.avatar
      : `${SERVER}/${activeChatUser.avatar}`
    : assets.avatar_icon

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  /* ================= LOAD MESSAGES ================= */
  useEffect(() => {
    if (!messagesId) return
    getMessagesApi(messagesId)
      .then(res => setMessages(res.data || []))
      .catch(() => toast.error("Failed to load messages"))
  }, [messagesId, setMessages])

  /* ================= SOCKET LISTENER ================= */
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !messagesId) return

    socket.emit("join-chat", { chatId: messagesId })

    const handleIncoming = (message) => {
      setMessages(prev =>
        prev.some(m => m.id === message.id) ? prev : [...prev, message]
      )
    }

    socket.on("receive-message", handleIncoming)
    return () => socket.off("receive-message", handleIncoming)
  }, [messagesId, setMessages])

  /* ================= SEND TEXT ================= */
  const sendMessage = async () => {
    if (!input.trim() || !messagesId || !userData) return

    const tempId = Date.now()
    const optimisticMsg = {
      id: tempId,
      text: input.trim(),
      sender_id: userData.id,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, optimisticMsg])
    setInput("")

    try {
      const res = await sendMessageApi({
        chatId: messagesId,
        senderId: userData.id,
        receiverId: chatUser.rId,
        text: optimisticMsg.text
      })

      const realMsg = res.data
      getSocket()?.emit("send-message", { chatId: messagesId, message: realMsg })

      setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m))
    } catch {
      toast.error("Message failed")
      setMessages(prev => prev.filter(m => m.id !== tempId))
    }
  }

  /* ================= SEND MEDIA ================= */
  const sendMedia = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const url = await upload(file)
      const type = file.type.startsWith("image") ? "image" : "file"

      const res = await sendMessageApi({
        chatId: messagesId,
        senderId: userData.id,
        receiverId: chatUser.rId,
        media: url,
        mediaType: type
      })

      getSocket()?.emit("send-message", { chatId: messagesId, message: res.data })
      setMessages(prev => [...prev, res.data])
    } catch {
      toast.error("Upload failed")
    }
  }

  const formatTime = (msg) => {
    const date = new Date(msg.created_at)
    return isNaN(date) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  /* ================= SAFE RENDER ================= */
  if (!chatUser || !activeChatUser || !userData) {
    return (
      <div className="chat-welcome">
        <img src={assets.logo_icon} alt="" />
        <p>Select a chat to start messaging</p>
      </div>
    )
  }

  return (
    <div className={`chat-box ${chatVisible ? "" : "hidden"}`}>
      <div className="chat-user">
        <img src={avatarUrl} alt="" />
        <p>{activeChatUser.username}</p>
        <img src={assets.arrow_icon} className="arrow" onClick={() => setChatVisible(false)} alt="" />
      </div>

      <div className="chat-msg">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.sender_id === userData.id ? "s-msg" : "r-msg"}>
            {msg.media && msg.media_type === "image" && (
              <img className="msg-img" src={msg.media} alt="" />
            )}
            {msg.text && <p className="msg">{msg.text}</p>}
            <span className="time">{formatTime(msg)}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="chat-input">
        <img src={assets.emoji_icon} onClick={() => setShowEmoji(!showEmoji)} alt="" />
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Send a message..."
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />

        {showEmoji && (
          <div className="emoji-picker">
            <EmojiPicker onEmojiClick={e => setInput(p => p + e.emoji)} />
          </div>
        )}

        <input id="mediaUpload" type="file" hidden onChange={sendMedia} />
        <label htmlFor="mediaUpload">
          <img src={assets.gallery_icon} alt="" />
        </label>

        <img src={assets.send_button} onClick={sendMessage} alt="" />
      </div>
    </div>
  )
}

export default ChatBox
