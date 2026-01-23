// backend/routes/messageRoutes.js

const express = require("express");
const db = require("../db/db");
const router = express.Router();

/* ================= SEND MESSAGE ================= */
router.post("/send", async (req, res) => {
  const { chatId, senderId, receiverId, text, media, mediaType } = req.body;

  if (!chatId || !senderId || !receiverId) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await db.query(
      `INSERT INTO messages 
        (chat_id, sender_id, receiver_id, text, media, media_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        chatId,
        senderId,
        receiverId,
        text || null,
        media || null,
        mediaType || null
      ]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ message: "Server error" });
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

module.exports = router;
