const express = require("express")
const db = require("../db/db")
const router = express.Router()
const authMiddleware = require("../middleware/authMiddleware")

/* ================= SEND MESSAGE ================= */
router.post("/send", authMiddleware, async (req, res) => {
  try {
    const { receiverId, text, media, mediaType, chatId } = req.body
    const senderId = req.user.id

    if (!chatId || !receiverId)
      return res.status(400).json({ error: "chatId and receiverId required" })

    const [result] = await db.query(
      `INSERT INTO messages 
       (chat_id, sender_id, receiver_id, text, media, media_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [chatId, senderId, receiverId, text || null, media || null, mediaType || null]
    )

    const [rows] = await db.query(
      "SELECT * FROM messages WHERE id = ?",
      [result.insertId]
    )

    res.json(rows[0])
  } catch (err) {
    console.error("Send message error:", err)
    res.status(500).json({ error: "Message send failed" })
  }
})

/* ================= LOAD CHAT MESSAGES ================= */
router.get("/:chatId", authMiddleware, async (req, res) => {
  try {
    const { chatId } = req.params

    const [rows] = await db.query(
      `SELECT * FROM messages
       WHERE chat_id = ?
       ORDER BY created_at ASC`,
      [chatId]
    )

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

/* ================= DELETE MESSAGE ================= */
router.delete("/:messageId", authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params
    const userId = req.user.id

    const [rows] = await db.query(
      "SELECT sender_id, chat_id FROM messages WHERE id = ?",
      [messageId]
    )

    if (!rows.length) return res.status(404).json({ message: "Not found" })
    if (rows[0].sender_id !== userId)
      return res.status(403).json({ message: "Not allowed" })

    await db.query(
      "UPDATE messages SET text = ?, deleted = 1 WHERE id = ?",
      ["This message was deleted", messageId]
    )

    req.app.get("io").to(rows[0].chat_id).emit("message-deleted", {
      messageId,
      text: "This message was deleted"
    })

    res.json({ message: "Deleted" })
  } catch (err) {
    res.status(500).json({ message: "Server error" })
  }
})

/* ================= EDIT MESSAGE ================= */
router.put("/:messageId", authMiddleware, async (req, res) => {
  try {
    const { messageId } = req.params
    const { text } = req.body
    const userId = req.user.id

    const [rows] = await db.query(
      "SELECT sender_id, chat_id FROM messages WHERE id = ?",
      [messageId]
    )

    if (!rows.length) return res.status(404).json({ message: "Not found" })
    if (rows[0].sender_id !== userId)
      return res.status(403).json({ message: "Not allowed" })

    await db.query(
      "UPDATE messages SET text = ?, edited = 1 WHERE id = ?",
      [text, messageId]
    )

    req.app.get("io").to(rows[0].chat_id).emit("message-edited", {
      messageId,
      text
    })

    res.json({ message: "Edited" })
  } catch {
    res.status(500).json({ message: "Server error" })
  }
})

/* ================= MARK SINGLE MESSAGE READ ================= */
router.put("/read/:id", authMiddleware, async (req, res) => {
  const { id } = req.params

  const [rows] = await db.query(
    "SELECT chat_id FROM messages WHERE id = ?",
    [id]
  )

  await db.query(
    "UPDATE messages SET is_read = 1 WHERE id = ?",
    [id]
  )

  if (rows.length) {
    req.app.get("io").to(rows[0].chat_id).emit("message-read", { messageId: id })
  }

  res.json({ success: true })
})

/* ================= MARK ALL READ IN CHAT ================= */
router.put("/read-chat/:chatId", authMiddleware, async (req, res) => {
  const { chatId } = req.params

  await db.query(
    "UPDATE messages SET is_read = 1 WHERE chat_id = ?",
    [chatId]
  )

  res.json({ success: true })
})

module.exports = router
