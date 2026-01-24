// backend/routes/messageRoutes.js

const express = require("express");
const db = require("../db/db");
const router = express.Router();

/* ================= SEND MESSAGE ================= */
router.post("/send", async (req, res) => {
  const { chatId, senderId, receiverId, text, media, mediaType } = req.body;

  try {
    // 1️⃣ Insert message
    const [result] = await db.query(
      `INSERT INTO messages 
       (chat_id, sender_id, receiver_id, text, media, media_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [chatId, senderId, receiverId, text || null, media || null, mediaType || null]
    );

    // 2️⃣ Get inserted message ID
    const insertedId = result.insertId;

    // 3️⃣ Fetch the full message row (includes created_at)
    const [rows] = await db.query(
      `SELECT * FROM messages WHERE id = ?`,
      [insertedId]
    );

    const newMessage = rows[0];

    // 4️⃣ Send back to frontend
    res.json(newMessage);

  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Message send failed" });
  }
});

/* ================= GET MESSAGES ================= */
router.get("/:chatId", async (req, res) => {
  const { chatId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM messages 
       WHERE chat_id = ? 
       ORDER BY created_at ASC`,
      [chatId]
    );

    res.json(rows);

  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= MARK AS READ ================= */
router.put("/read/:chatId", async (req, res) => {
  const { chatId } = req.params;
  const { userId } = req.body;

  try {
    await db.query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE chat_id = ? AND receiver_id = ?`,
      [chatId, userId]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Read update error:", err);
    res.status(500).json({ error: "Read update failed" });
  }
});

module.exports = router;
