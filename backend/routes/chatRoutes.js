// backend/routes/chatRoutes.js
const express = require("express");
const db = require("../db/db");
const authMiddleware = require("../middleware/authMiddleware")
const router = express.Router();

/* ================= OPEN CHAT ================= */
router.post("/open", async (req, res) => {
  const { senderId, receiverId } = req.body;

  const user1 = Math.min(senderId, receiverId);
  const user2 = Math.max(senderId, receiverId);

  try {
    const [rows] = await db.query(
      "SELECT id FROM chats WHERE user1_id=? AND user2_id=?",
      [user1, user2]
    );

    if (rows.length) return res.json({ chatId: rows[0].id });

    const [result] = await db.query(
      "INSERT INTO chats (user1_id, user2_id) VALUES (?,?)",
      [user1, user2]
    );

    res.json({ chatId: result.insertId });
  } catch (err) {
    res.status(500).json(err);
  }
});

/* ================= CREATE CHAT ================= */
router.post("/create", async (req, res) => {
  const { user1, user2 } = req.body;

  if (!user1 || !user2 || user1 === user2) {
    return res.status(400).json({ message: "Invalid users" });
  }

  try {
    // ensure both users exist
    const [[u1]] = await db.query("SELECT id FROM users WHERE id = ?", [user1]);
    const [[u2]] = await db.query("SELECT id FROM users WHERE id = ?", [user2]);

    if (!u1 || !u2) {
      return res.status(400).json({ message: "User not found" });
    }

    // check if chat already exists
    const [existing] = await db.query(
      `
      SELECT * FROM chats
      WHERE (user1_id = ? AND user2_id = ?)
         OR (user1_id = ? AND user2_id = ?)
      `,
      [user1, user2, user2, user1]
    );

    if (existing.length) {
      return res.json(existing[0]);
    }

    // create chat
    const [result] = await db.query(
      "INSERT INTO chats (user1_id, user2_id) VALUES (?, ?)",
      [user1, user2]
    );

    res.status(201).json({
      id: result.insertId,
      user1_id: user1,
      user2_id: user2
    });
  } catch (err) {
    console.error("Chat create error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/* ================= GET USER CHATS ================= */
/* ================= GET USER CHATS ================= */
router.get("/user/:userId", authMiddleware, async (req, res) => {
  const { userId } = req.params

  try {
    const [rows] = await db.query(
      `
      SELECT 
        c.id AS chatId,
        c.user1_id,
        c.user2_id,
        u1.username AS user1_name,
        u1.avatar AS user1_avatar,
        u2.username AS user2_name,
        u2.avatar AS user2_avatar
      FROM chats c
      JOIN users u1 ON u1.id = c.user1_id
      JOIN users u2 ON u2.id = c.user2_id
      WHERE c.user1_id = ? OR c.user2_id = ?
      ORDER BY c.created_at DESC
      `,
      [userId, userId]
    )

    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})



/* ================= GET MY CHATS ================= */
router.get("/my", authMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `
      SELECT 
        c.id AS chatId,
        IF(c.user1_id = ?, c.user2_id, c.user1_id) AS rId,
        u.username,
        u.avatar,

        -- Last message
        (SELECT text FROM messages 
         WHERE chat_id = c.id 
         ORDER BY created_at DESC LIMIT 1) AS lastMessage,

        -- Unread count
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
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json(err);
  }
});


module.exports = router;
