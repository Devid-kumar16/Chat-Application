// src/components/ChatBox/ChatBox.jsx

import React, { useEffect, useContext, useState, useRef } from "react"
import "./ChatBox.css"
import socket from "../../socket"

import assets from "../../assets/assets"
import { AppContext } from "../../context/AppContext"
import upload from "../../lib/upload"
import { toast } from "react-toastify"
import EmojiPicker from "emoji-picker-react"
import { sendMessageApi, getMessagesApi } from "../../api/messageApi"

const ChatBox = () => {
  const {
    userData,
    messagesId,
    chatUser,
    messages,
    setMessages,
    chatVisible,
    setChatVisible
  } = useContext(AppContext)

  const [input, setInput] = useState("")
  const [showEmoji, setShowEmoji] = useState(false)
  const [recording, setRecording] = useState(false)

  const endRef = useRef(null)
  const mediaRecorderRef = useRef(null)

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  /* ================= LOAD MESSAGES ================= */
  useEffect(() => {
    if (!messagesId) return

    const loadMessages = async () => {
      try {
        const res = await getMessagesApi(messagesId)
        setMessages(res.data || [])
      } catch (err) {
        console.error(err)
        toast.error("Failed to load messages")
      }
    }

    loadMessages()
  }, [messagesId, setMessages])


useEffect(() => {
  if (!messagesId) return

  socket.connect()
  socket.emit("join-chat", messagesId)

  return () => {
    socket.disconnect()
  }
}, [messagesId])


useEffect(() => {
  socket.on("receive-message", (message) => {
    setMessages(prev => [...prev, message])
  })

  return () => {
    socket.off("receive-message")
  }
}, [setMessages])



  /* ================= REFRESH MESSAGES ================= */
  const refreshMessages = async () => {
    const res = await getMessagesApi(messagesId)
    setMessages(res.data || [])
  }

  /* ================= SEND TEXT ================= */
const sendMessage = async () => {
  if (!input.trim()) return

  try {
    const messagePayload = {
      chatId: messagesId,
      senderId: userData.id,
      receiverId: chatUser.rId,
      text: input.trim()
    }

    await sendMessageApi(messagePayload)

socket.emit("send-message", {
  chatId: messagesId,
  message: {
    ...payload,
    sender_id: userData.id,
    created_at: new Date()
  }
})

    setInput("")
  } catch {
    toast.error("Message not sent")
  }
}


  /* ================= SEND MEDIA ================= */
  const sendMedia = async (e) => {
    const file = e.target.files[0]
    if (!file || !messagesId) return

    try {
      const url = await upload(file)
      const type = file.type.startsWith("video")
        ? "video"
        : file.type.startsWith("audio")
        ? "audio"
        : "image"

      await sendMessageApi({
        chatId: messagesId,
        senderId: userData.id,
        receiverId: chatUser.rId,
        media: url,
        mediaType: type
      })

      await refreshMessages()
    } catch {
      toast.error("Media upload failed")
    }
  }

  /* ================= VOICE ================= */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)

      const chunks = []
      mediaRecorderRef.current.ondataavailable = e => chunks.push(e.data)

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        const url = await upload(blob)

        await sendMessageApi({
          chatId: messagesId,
          senderId: userData.id,
          receiverId: chatUser.rId,
          media: url,
          mediaType: "audio"
        })

        await refreshMessages()
      }

      mediaRecorderRef.current.start()
      setRecording(true)
    } catch {
      toast.error("Microphone permission denied")
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  /* ================= FORMAT TIME ================= */
  const formatTime = (ts) => {
    if (!ts) return ""
    const d = new Date(ts)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  /* ================= EMPTY STATE ================= */
  if (!chatUser) {
    return (
      <div className={`chat-welcome ${chatVisible ? "" : "hidden"}`}>
        <img src={assets.logo_icon} alt="" />
        <p>Select a chat to start messaging</p>
      </div>
    )
  }

  return (
    <div className={`chat-box ${chatVisible ? "" : "hidden"}`}>
      {/* HEADER */}
      <div className="chat-user">
        <img src={chatUser.userData.avatar} alt="" />
        <p>{chatUser.userData.name}</p>
        <img
          src={assets.arrow_icon}
          className="arrow"
          onClick={() => setChatVisible(false)}
          alt=""
        />
      </div>

      {/* MESSAGES */}
      <div className="chat-msg">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={msg.sender_id === userData.id ? "s-msg" : "r-msg"}
          >
            {msg.media_type === "image" && (
              <img className="msg-img" src={msg.media} alt="" />
            )}

            {msg.media_type === "video" && (
              <video className="msg-video" controls src={msg.media} />
            )}

            {msg.media_type === "audio" && (
              <audio controls src={msg.media} />
            )}

            {msg.text && <p className="msg">{msg.text}</p>}

            <span className="time">{formatTime(msg.created_at)}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* INPUT */}
      <div className="chat-input">
        <img
          src={assets.emoji_icon}
          alt=""
          onClick={() => setShowEmoji(!showEmoji)}
        />

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

        <input
          id="mediaUpload"
          type="file"
          hidden
          accept="image/*,video/*,audio/*"
          onChange={sendMedia}
        />

        <label htmlFor="mediaUpload">
          <img src={assets.gallery_icon} alt="" />
        </label>

        <img
          src={recording ? assets.mic_on : assets.mic_off}
          onClick={recording ? stopRecording : startRecording}
          alt=""
        />

        <img src={assets.send_button} onClick={sendMessage} alt="" />
      </div>
    </div>
  )
}

export default ChatBox
