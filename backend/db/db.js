const mysql = require("mysql2/promise");
require("dotenv").config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection()
  .then(() => console.log("✅ MySQL connected"))
  .catch(err => {
    console.error(" MySQL connection failed:", err);
    process.exit(1);
  });

module.exports = db;
