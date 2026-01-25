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

/* ================= REMOVE BROKEN ROUTE ================= */
/*
❌ DELETED:
router.post("/conversation", ...) 
This was MongoDB code and does not belong in MySQL project.
Chat creation is already handled in chatRoutes.
*/

module.exports = router
