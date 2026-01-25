const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ message: "No token" })

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    if (!decoded.id) return res.status(401).json({ message: "Invalid token" })

    req.user = { id: Number(decoded.id) }
    next()
  } catch (err) {
    console.error("Auth error:", err.message)
    res.status(401).json({ message: "Token invalid" })
  }
}
