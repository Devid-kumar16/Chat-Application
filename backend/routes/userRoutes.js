const express = require("express")
const db = require("../db/db")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const authMiddleware = require("../middleware/authMiddleware")

const router = express.Router()

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }

  try {
    // check email
    const [exists] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    )

    if (exists.length) {
      return res.status(400).json({ message: "Email already exists" })
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // ✅ FIXED INSERT
    const [result] = await db.query(
      `INSERT INTO users (username, email, password)
       VALUES (?, ?, ?)`,
      [username, email, hashedPassword]
    )

    const token = jwt.sign(
      { id: result.insertId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    )

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        username,
        email
      }
    })
  } catch (err) {
    console.error("REGISTER ERROR:", err)
    res.status(500).json({
      message: "Server error",
      error: err.sqlMessage || err.message
    })
  }
})


/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const [rows] = await db.query("SELECT * FROM users WHERE email=?", [email]);
  if (!rows.length) return res.status(400).json({ message: "Invalid" });

  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid" });

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.username, // 🔥 IMPORTANT FIX
      email: user.email,
      avatar: user.avatar,
      bio: user.bio
    }
  });
});

/* ================= CURRENT USER ================= */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, avatar FROM users WHERE id = ?",
      [req.user.id]
    )

    res.json(rows[0])
  } catch {
    console.error("GET /users/me error:", err)
    res.status(500).json({ message: "Server error" })
  }
})

/* ================= UPDATE AVATAR ================= */
router.put("/avatar", authMiddleware, async (req, res) => {
  const { avatar } = req.body

  if (!avatar) {
    return res.status(400).json({ message: "Avatar URL required" })
  }

  try {
    await db.query(
      "UPDATE users SET avatar = ? WHERE id = ?",
      [avatar, req.user.id]
    )

    res.json({
      success: true,
      avatar
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})



// GET USER BY ID (for chat, profile preview)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id

    const [rows] = await db.query(
      "SELECT id, username, email, avatar FROM users WHERE id = ?",
      [userId]
    )

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})


/* UPDATE PROFILE */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body
    const userId = req.user.id

    console.log("Updating user:", userId)
    console.log("Avatar URL:", avatar)

    await db.query(
      "UPDATE users SET username=?, bio=?, avatar=? WHERE id=?",
      [username, bio, avatar, userId]
    )

    res.json({ success: true })
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: "Profile update failed" })
  }
})




router.get("/", authMiddleware, async (req, res) => {
  const [users] = await db.query(
    "SELECT id, username, email, avatar, bio, last_seen FROM users"
  )
  res.json(users)
})


module.exports = router
