import React, { useEffect, useContext, useState, useRef } from "react"
import "./ChatBox.css"
import assets from "../../assets/assets"
import { AppContext } from "../../context/AppContext"
import upload from "../../lib/upload"
import { toast } from "react-toastify"
import EmojiPicker from "emoji-picker-react"
import { sendMessageApi, getMessagesApi, deleteMessageApi, editMessageApi, markMessagesReadApi, markMessageReadApi } from "../../api/messageApi"
import { getSocket, getRoomId } from "../../socket"


const SERVER = "http://localhost:5000"

const ChatBox = () => {
  const {
    userData,
    chatUser,
    messages = [],
    setMessages,
    chatVisible,
    setChatVisible,
    onlineUsers
  } = useContext(AppContext)


  const roomId = userData && chatUser
  ? [userData.id, chatUser.id].sort((a,b)=>a-b).join("_")
  : null



  const [input, setInput] = useState("")
  const [showEmoji, setShowEmoji] = useState(false)
  const endRef = useRef(null)
  const pickerRef = useRef(null)
  const inputRef = useRef(null)
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState("")


  const isOnline =
    chatUser &&
    onlineUsers.map(id => String(id)).includes(String(chatUser.id))


  /* CLEAR MESSAGES WHEN CHAT CHANGES */
  useEffect(() => {
    setMessages([])
  }, [chatUser])

  /* AVATAR */
  const avatarUrl = chatUser?.avatar
    ? chatUser.avatar.startsWith("http")
      ? chatUser.avatar
      : `${SERVER}/${chatUser.avatar}`
    : assets.avatar_icon

  /* AUTO SCROLL */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

/* LOAD MESSAGES */
useEffect(() => {
  if (!chatUser) return
  getMessagesApi(chatUser.id).then(res => setMessages(res.data || []))
}, [chatUser])



useEffect(() => {
  const socket = getSocket()
if (!socket || !roomId) return
socket.emit("join-chat", { chatId: roomId })


  const handleIncoming = (message) => {
    setMessages(prev =>
      prev.some(m => m.id === message.id) ? prev : [...prev, message]
    )
  }

      socket.on("receive-message", msg =>
      setMessages(prev => (prev.some(m => m.id === msg.id) ? prev : [...prev, msg]))
    )

  socket.on("message-deleted", ({ messageId }) => {
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, deleted: 1, text: "This message was deleted" } : m)
    )
  })

  socket.on("message-edited", ({ messageId, text }) => {
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, text, edited: 1 } : m)
    )
  })

  socket.on("message-read", ({ messageId }) => {
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, is_read: 1 } : m)
    )
  })

  return () => {
    socket.off("receive-message", handleIncoming)
    socket.off("message-deleted")
    socket.off("message-edited")
    socket.off("message-read")
  }

}, [roomId])



useEffect(() => {
  if (!roomId || !userData) return

  const socket = getSocket()

  messages
    .filter(m => m.sender_id !== userData.id && m.is_read === 0)
    .forEach(m => {
      markMessageReadApi(m.id)
      socket?.emit("mark-read", { chatId: roomId, messageId: m.id })

    })

}, [messages, roomId, userData])


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowEmoji(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])



  /* SEND TEXT */
const sendMessage = async () => {
  if (!input.trim() || !chatUser) return

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
      receiverId: chatUser.id,
      text: optimisticMsg.text
    })

    const realMsg = res.data

    getSocket()?.emit("send-message", { chatId: roomId, message: realMsg })


    setMessages(prev => prev.map(m => m.id === tempId ? realMsg : m))
  } catch (err) {
    console.error(err)
    toast.error("Message failed")
    setMessages(prev => prev.filter(m => m.id !== tempId))
  }
}



  const handleDelete = async (id) => {
    try {
      await deleteMessageApi(id)

      setMessages(prev =>
        prev.map(m =>
          m.id === id ? { ...m, text: "This message was deleted", deleted: 1 } : m
        )
      )


      getSocket()?.emit("message-deleted", { chatId: roomId, messageId: id })



    } catch {
      toast.error("Delete failed")
    }
  }


  /* EDIT */
  const handleEditSave = async () => {
    try {
      await editMessageApi(editing.id, editText)

      setMessages(prev =>
        prev.map(m =>
          m.id === editing.id ? { ...m, text: editText, edited: 1 } : m
        )
      )

       getSocket()?.emit("message-edited", { chatId: roomId, messageId: editing.id, text: editText })



      setEditing(null)

    } catch {
      toast.error("Edit failed")
    }
  }


  /* SEND MEDIA */
const sendMedia = async (e) => {
  const file = e.target.files[0]
  if (!file || !chatUser || !roomId) return   // ✅ use roomId

  try {
    const url = await upload(file)
    const type = file.type.startsWith("image") ? "image" : "file"

    const res = await sendMessageApi({
      receiverId: chatUser.id,
      media: url,
      mediaType: type
    })

    const realMsg = res.data

    // 🔥 REALTIME SEND
    getSocket()?.emit("send-message", { chatId: roomId, message: realMsg })

    // 🔥 UI UPDATE
    setMessages(prev =>
      prev.some(m => m.id === realMsg.id) ? prev : [...prev, realMsg]
    )

  } catch (err) {
    console.error(err)
    toast.error("Upload failed")
  }
}



  const formatTime = (msg) => {
    const date = new Date(msg.created_at)
    return isNaN(date) ? "" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  if (!chatUser || !userData) {
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
        <img src={avatarUrl} alt="" />
        <p className="chat-name">
          {chatUser.username}
          {isOnline && <span className="online-dot"></span>}
        </p>
        <img src={assets.arrow_icon} className="arrow" onClick={() => setChatVisible(false)} alt="" />
      </div>

      <div className="chat-msg">
        {messages.map(msg => {
          const isMine =
            Number(msg.sender_id ?? msg.senderId) === Number(userData.id)



          return (
            <div
              key={msg.id}
              className={`message-row ${isMine ? "me" : "other"}`}
            >
<div className="msg-wrapper">
  <div className="msg">

    {/* IMAGE */}
    {msg.media && msg.media_type === "image" && (
      <img
        src={msg.media.startsWith("http") ? msg.media : `${SERVER}/${msg.media}`}
        className="msg-img"
        alt=""
      />
    )}

    {/* TEXT / CAPTION */}
    {editing?.id === msg.id ? (
      <div className="edit-inline">
        <input
          value={editText}
          onChange={e => setEditText(e.target.value)}
          autoFocus
          onKeyDown={e => e.key === "Enter" && handleEditSave()}
        />
        <div className="edit-actions">
          <button onClick={handleEditSave}>✔</button>
          <button onClick={() => setEditing(null)}>✖</button>
        </div>
      </div>
    ) : (
      msg.text && (
        <div className="msg-text">
          {msg.deleted
            ? <i>This message was deleted</i>
            : <>
                {msg.text}
                {Number(msg.edited) === 1 && (
                  <span className="edited">(edited)</span>
                )}
              </>
          }
        </div>
      )
    )}

    {/* ACTION BUTTONS */}
    {isMine && Number(msg.deleted) !== 1 && (
      <div className="msg-actions">
        <span onClick={() => { setEditing(msg); setEditText(msg.text) }}>✏️</span>
        <span onClick={() => handleDelete(msg.id)}>🗑</span>
      </div>
    )}

  </div>

  {/* ✅ TICKS OUTSIDE BUBBLE */}
{isMine && (
  <span className={`ticks ${msg.is_read ? "seen" : ""}`}>
    {msg.is_read ? "✓✓" : "✓"}
  </span>
)}

</div>


              <span className="time">{formatTime(msg)}</span>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>


      {/* INPUT AREA */}
      <div className="chat-input">

        {/* ✅ EMOJI BUTTON */}
        <img
          src={assets.emoji_icon}
          alt="emoji"
          className="emoji-btn"
          onClick={() => setShowEmoji(!showEmoji)}
        />


        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Send a message..."
          onKeyDown={e => e.key === "Enter" && sendMessage()}
        />


        {showEmoji && (
          <div ref={pickerRef} className="emoji-picker">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                setInput(prev => prev + emojiData.emoji)
                inputRef.current?.focus()
              }}
            />

          </div>
        )}

        <input id="mediaUpload" type="file" hidden onChange={sendMedia} />
        <label htmlFor="mediaUpload">
          <img src={assets.gallery_icon} alt="" />
        </label>

        <img src={assets.send_button} onClick={sendMessage} className="send-btn" alt="" />

      </div>
    </div>
  )
}

export default ChatBox