// middleware/auth.js
const jwtUtil = require("../../utils/jwtfend");

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ status: false, message: "No token provided" });

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) 
    return res.status(401).json({ status: false, message: "Invalid token format" });

  try {
    const decoded = jwtUtil.verifyAccess(token);
    req.user = decoded; // simpan payload ke request
    next();
  } catch (err) {
    return res.status(401).json({ status: false, message: "Token invalid or expired" });
  }
};