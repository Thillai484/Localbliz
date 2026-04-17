const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    const authHeader = req.header("Authorization");

    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ GUARANTEED STRUCTURE
    req.user = {
      id: decoded.user.id
    };

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    res.status(401).json({ message: "Invalid token" });
  }
};