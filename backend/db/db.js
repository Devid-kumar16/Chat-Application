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

    // 🔥 VERIFY messages.chat_id type
    const [columns] = await conn.query(`
      SELECT DATA_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = 'messages'
      AND COLUMN_NAME = 'chat_id'
    `, [DB_NAME])

if (!columns.length) {
  console.error("❌ messages.chat_id column not found!")
  conn.release()
  process.exit(1)
}


    const type = columns[0].DATA_TYPE

    if (type !== "varchar" && type !== "text") {
      console.error(`
❌ DATABASE SCHEMA ERROR:
messages.chat_id must be VARCHAR but is ${type.toUpperCase()}.

Run this SQL:

ALTER TABLE messages MODIFY chat_id VARCHAR(50) NOT NULL;
      `)
      process.exit(1)
    }

    console.log("✅ Database schema verified")

    conn.release()
  } catch (err) {
    console.error("❌ MySQL startup check failed:", err.message)
    process.exit(1)
  }
})()

module.exports = db
