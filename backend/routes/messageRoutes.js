const express = require("express")
const db = require("../db/db")
const router = express.Router()
const authMiddleware = require("../middleware/authMiddleware")

/* ================= SEND MESSAGE ================= */
router.post("/send", authMiddleware, async (req, res) => {
  const { chatId, receiverId, text, media, mediaType } = req.body
  const senderId = req.user.id  // 🔥 NEVER trust client senderId

  try {
    const [result] = await db.query(
      `INSERT INTO messages 
       (chat_id, sender_id, receiver_id, text, media, media_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [chatId, senderId, receiverId, text || null, media || null, mediaType || null]
    )

    const insertedId = result.insertId

    const [rows] = await db.query(
      `SELECT * FROM messages WHERE id = ?`,
      [insertedId]
    )

    res.json(rows[0])

  } catch (err) {
    console.error("Send message error:", err)
    res.status(500).json({ error: "Message send failed" })
  }
})

/* ================= GET MESSAGES ================= */
router.get("/:chatId", authMiddleware, async (req, res) => {
  const { chatId } = req.params

  try {
    const [rows] = await db.query(
      `SELECT * FROM messages
       WHERE chat_id = ?
       ORDER BY created_at ASC`,
      [chatId]
    )

    res.json(rows)

  } catch (err) {
    console.error("Fetch messages error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

/* ================= MARK AS READ ================= */
router.put("/read/:chatId", authMiddleware, async (req, res) => {
  const { chatId } = req.params
  const userId = req.user.id

  try {
    await db.query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE chat_id = ? AND receiver_id = ?`,
      [chatId, userId]
    )

    res.json({ success: true })

  } catch (err) {
    console.error("Read update error:", err)
    res.status(500).json({ error: "Read update failed" })
  }
})

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

    const io = req.app.get("io")
    io.to(rows[0].chat_id).emit("message-deleted", {
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

    const io = req.app.get("io")
    io.to(rows[0].chat_id).emit("message-edited", {
      messageId,
      text
    })

    res.json({ message: "Edited" })
  } catch {
    res.status(500).json({ message: "Server error" })
  }
})


// MARK ALL MESSAGES IN CHAT AS READ
router.put("/read-chat/:chatId", authMiddleware, async (req, res) => {
  const { chatId } = req.params

  await db.query(
    "UPDATE messages SET is_read = 1 WHERE chat_id = ?",
    [chatId]
  )

  res.json({ success: true })
})


// MARK SINGLE MESSAGE READ
router.put("/read/:id", authMiddleware, async (req, res) => {
  const { id } = req.params

  await db.query(
    "UPDATE messages SET is_read = 1 WHERE id = ?",
    [id]
  )

  // 🔥 notify sender live
  req.app.get("io").emit("message-read", { messageId: id })

  res.json({ success: true })
})




module.exports = router
