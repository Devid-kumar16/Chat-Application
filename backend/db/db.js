const mysql = require("mysql2/promise")
require("dotenv").config()

const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_NAME
} = process.env

if (!DB_HOST || !DB_USER || !DB_NAME) {
  console.error("❌ Missing database environment variables")
  process.exit(1)
}

const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
})

/* ================= DB STARTUP CHECK ================= */
;(async () => {
  try {
    const conn = await db.getConnection()

    // Confirm DB connected
    const [dbName] = await conn.query("SELECT DATABASE() as db")
    console.log(`✅ MySQL connected to database: ${dbName[0].db}`)

    console.log("ℹ️ Database ready (chat_id uses INT from chats table)")

    conn.release()
  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message)
    console.error("⚠️ Server will continue running, but DB queries will fail until fixed.")
    // 🚀 IMPORTANT: do NOT crash server
  }
})()

module.exports = db
