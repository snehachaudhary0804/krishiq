const { verifyToken } = require("../utils/token");
const User = require("../models/User");

async function protect(req, res, next) {
 try {
 const header = req.headers.authorization || "";
 const token = header.startsWith("Bearer ") ? header.slice(7) : null;
 if (!token) return res.status(401).json({ message: "Not authenticated. Please log in." });

 const decoded = verifyToken(token);
 const user = await User.findById(decoded.id);
 if (!user) return res.status(401).json({ message: "User no longer exists." });

 req.user = user;
 next();
 } catch (err) {
 return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
 }
}

function allowRoles(...roles) {
 return (req, res, next) => {
 if (!req.user || !roles.includes(req.user.role)) {
 return res.status(403).json({ message: "You do not have permission to perform this action." });
 }
 next();
 };
}

module.exports = { protect, allowRoles };
