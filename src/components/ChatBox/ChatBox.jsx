import React, { useEffect, useContext, useState, useRef, useMemo } from "react"
import "./ChatBox.css"
import socket from "../../socket"
import assets from "../../assets/assets"
import { AppContext } from "../../context/AppContext"
import upload from "../../lib/upload"
import { toast } from "react-toastify"
import EmojiPicker from "emoji-picker-react"
import { sendMessageApi, getMessagesApi } from "../../api/messageApi"

const SERVER = "http://localhost:5000"

const ChatBox = () => {
  const {
    userData,
    messagesId,
    chatUser,
    messages,
    setMessages,
    getUserById,
    chatVisible,
    setChatVisible
  } = useContext(AppContext)

  const [input, setInput] = useState("")
  const [showEmoji, setShowEmoji] = useState(false)
  const endRef = useRef(null)
  const currentRoom = useRef(null)

  /* ================= ACTIVE USER ================= */
  const activeChatUser = useMemo(() => {
    if (!chatUser?.rId) return null
    return getUserById(chatUser.rId)
  }, [chatUser, getUserById])

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

  /* ================= SOCKET ROOM ================= */
  useEffect(() => {
    if (!messagesId || !userData?.id) return

    if (currentRoom.current) {
      socket.emit("leave-chat", currentRoom.current)
    }

    socket.emit("join-chat", { chatId: messagesId, userId: userData.id })
    currentRoom.current = messagesId

    const handleIncoming = (message) => {
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev
        return [...prev, message]
      })
    }

    socket.on("receive-message", handleIncoming)

    return () => socket.off("receive-message", handleIncoming)
  }, [messagesId, userData?.id, setMessages])

  /* ================= SEND TEXT ================= */
const sendMessage = async () => {
  if (!input.trim() || !messagesId || !chatUser) return

  const tempId = Date.now()

  const optimisticMsg = {
    id: tempId,
    text: input.trim(),
    sender_id: userData.id,
    receiver_id: chatUser.rId,
    created_at: new Date().toISOString(),
    status: "sending"
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

    const realMsg = res.data   // 🔥 MUST be full message from backend

    socket.emit("send-message", { chatId: messagesId, message: realMsg })

    setMessages(prev =>
      prev.map(m => m.id === tempId ? realMsg : m)
    )

  } catch (err) {
    toast.error("Message failed")
    setMessages(prev => prev.filter(m => m.id !== tempId))
  }
}


  /* ================= TIME FORMAT FIX ================= */
  const formatTime = (msg) => {
    const raw = msg.created_at || msg.createdAt || msg.timestamp || msg.time
    if (!raw) return ""

    const date = new Date(raw)
    if (isNaN(date.getTime())) return ""

    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  /* ================= SEND MEDIA ================= */
  const sendMedia = async (e) => {
    const file = e.target.files[0]
    if (!file || !messagesId) return

    try {
      const url = await upload(file)
      const type = file.type.split("/")[0]

      const res = await sendMessageApi({
        chatId: messagesId,
        senderId: userData.id,
        receiverId: chatUser.rId,
        media: url,
        mediaType: type
      })

      socket.emit("send-message", { chatId: messagesId, message: res.data })
      setMessages(prev => [...prev, res.data])
    } catch {
      toast.error("Upload failed")
    }
  }

  if (!chatUser) {
    return (
      <div className="chat-welcome">
        <img src={assets.logo_icon} alt="" />
        <p>Select a chat to start messaging</p>
      </div>
    )
  }

  return (
    <div className={`chat-box ${chatVisible ? "" : "hidden"}`}>

      {/* HEADER */}
      <div className="chat-user">
        <img src={`${avatarUrl}?v=${activeChatUser?.updated_at || Date.now()}`} alt="" />

        <p>{activeChatUser?.username || "User"}</p>
        <img src={assets.arrow_icon} className="arrow" onClick={() => setChatVisible(false)} alt="" />
      </div>

      {/* MESSAGES */}
      <div className="chat-msg">
        {messages.map((msg, index) => {
          const messageKey =
            msg.id || msg._id || `${msg.sender_id}-${msg.created_at}-${index}`

          return (
            <div key={messageKey} className={msg.sender_id === userData.id ? "s-msg" : "r-msg"}>
              {msg.media_type === "image" && <img className="msg-img" src={msg.media} alt="" />}
              {msg.media_type === "video" && <video className="msg-video" controls src={msg.media} />}
              {msg.media_type === "audio" && <audio controls src={msg.media} />}
              {msg.text && <p className="msg">{msg.text}</p>}
              <span className="time">{formatTime(msg)}</span>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* INPUT */}
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
