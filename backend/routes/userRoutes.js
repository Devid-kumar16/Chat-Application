const express = require("express")
const db = require("../db/db")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const authMiddleware = require("../middleware/authMiddleware")

const router = express.Router()

/* ================= REGISTER ================= */
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password)
    return res.status(400).json({ message: "All fields are required" })

  try {
    const [exists] = await db.query("SELECT id FROM users WHERE email = ?", [email])
    if (exists.length) return res.status(400).json({ message: "Email already exists" })

    const hashedPassword = await bcrypt.hash(password, 10)

    const [result] = await db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    )

    const token = jwt.sign({ id: result.insertId }, process.env.JWT_SECRET, { expiresIn: "7d" })

    res.status(201).json({
      token,
      user: { id: result.insertId, username, email }
    })
  } catch (err) {
    console.error("REGISTER ERROR:", err)
    res.status(500).json({ message: "Server error" })
  }
})

/* ================= LOGIN ================= */
router.post("/login", async (req, res) => {
  const { email, password } = req.body

  const [rows] = await db.query("SELECT * FROM users WHERE email=?", [email])
  if (!rows.length) return res.status(400).json({ message: "Invalid credentials" })

  const user = rows[0]
  const match = await bcrypt.compare(password, user.password)
  if (!match) return res.status(400).json({ message: "Invalid credentials" })

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" })

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio
    }
  })
})

/* ================= CURRENT USER ================= */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username, email, avatar, bio FROM users WHERE id=?",
      [req.user.id]
    )

    if (!rows.length) return res.status(404).json({ message: "User not found" })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

/* ================= UPDATE PROFILE ================= */
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body
    const userId = req.user.id

    // 1️⃣ Get current user data
    const [currentRows] = await db.query(
      "SELECT username, bio, avatar FROM users WHERE id=?",
      [userId]
    )

    if (!currentRows.length) {
      return res.status(404).json({ message: "User not found" })
    }

    const currentUser = currentRows[0]

    // 2️⃣ Use new values only if provided
    const updatedUsername = username?.trim() || currentUser.username
    const updatedBio = bio ?? currentUser.bio
    const updatedAvatar = avatar ?? currentUser.avatar

    // 3️⃣ Update DB
    await db.query(
      "UPDATE users SET username=?, bio=?, avatar=? WHERE id=?",
      [updatedUsername, updatedBio, updatedAvatar, userId]
    )

    // 4️⃣ Fetch updated user
    const [updatedRows] = await db.query(
      "SELECT id, username, email, avatar, bio FROM users WHERE id=?",
      [userId]
    )

    // 5️⃣ Return updated user object ONLY
    res.json(updatedRows[0])

  } catch (err) {
    console.error("Profile update error:", err)
    res.status(500).json({ message: "Profile update failed" })
  }
})


/* ================= SEARCH USERS ================= */
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const search = req.query.search || ""

    const [users] = await db.query(
      `SELECT id, username, email, avatar, bio
       FROM users
       WHERE id <> ?
       AND (LOWER(username) LIKE LOWER(?) OR LOWER(email) LIKE LOWER(?))`,
      [req.user.id, `%${search}%`, `%${search}%`]
    )

    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

/* ================= GET USER BY ID ================= */
router.get("/:id", authMiddleware, async (req, res) => {
  const [rows] = await db.query(
    "SELECT id, username, email, avatar, bio FROM users WHERE id=?",
    [req.params.id]
  )

  if (!rows.length) return res.status(404).json({ message: "User not found" })
  res.json(rows[0])
})

/* ================= GET ALL OTHER USERS ================= */
router.get("/", authMiddleware, async (req, res) => {
  const [users] = await db.query(
    "SELECT id, username, email, avatar, bio FROM users WHERE id <> ?",
    [req.user.id]
  )
  res.json(users)
})

module.exports = router
