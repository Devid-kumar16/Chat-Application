const express = require("express")
const db = require("../db/db")
const authMiddleware = require("../middleware/authMiddleware")
const router = express.Router()

/* ================= OPEN OR CREATE CHAT ================= */
router.post("/open", authMiddleware, async (req, res) => {
  const senderId = req.user.id
  const { receiverId } = req.body

  if (!receiverId || senderId === receiverId) {
    return res.status(400).json({ message: "Invalid users" })
  }

  const user1 = Math.min(senderId, receiverId)
  const user2 = Math.max(senderId, receiverId)

  try {
    // Check if chat exists
    const [rows] = await db.query(
      "SELECT id FROM chats WHERE user1_id=? AND user2_id=?",
      [user1, user2]
    )

    if (rows.length) {
      return res.json({ chatId: rows[0].id })
    }

    // Create new chat
    const [result] = await db.query(
      "INSERT INTO chats (user1_id, user2_id) VALUES (?,?)",
      [user1, user2]
    )

    res.json({ chatId: result.insertId })

  } catch (err) {
    console.error("Open chat error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

/* ================= GET MY CHATS (MAIN LIST) ================= */
router.get("/my", authMiddleware, async (req, res) => {
  const userId = req.user.id

  try {
    const [rows] = await db.query(
      `
      SELECT 
        c.id AS chatId,
        IF(c.user1_id = ?, c.user2_id, c.user1_id) AS rId,
        u.username,
        u.avatar,
        u.bio,

        (SELECT text FROM messages 
         WHERE chat_id = c.id 
         ORDER BY created_at DESC LIMIT 1) AS lastMessage,

        (SELECT COUNT(*) FROM messages 
         WHERE chat_id = c.id 
           AND receiver_id = ? 
           AND is_read = FALSE) AS unreadCount

      FROM chats c
      JOIN users u ON u.id = IF(c.user1_id = ?, c.user2_id, c.user1_id)
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.created_at DESC
      `,
      [userId, userId, userId, userId, userId]
    )

    res.json(rows)
  } catch (err) {
    console.error("Get chats error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

/* ================= GET SINGLE CHAT INFO ================= */
router.get("/:chatId", authMiddleware, async (req, res) => {
  const { chatId } = req.params
  const userId = req.user.id

  try {
    const [rows] = await db.query(
      `SELECT * FROM chats WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
      [chatId, userId, userId]
    )

    if (!rows.length) {
      return res.status(404).json({ message: "Chat not found" })
    }

    res.json(rows[0])
  } catch (err) {
    console.error("Chat fetch error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router
