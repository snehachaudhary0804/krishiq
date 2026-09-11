const jwt = require("jsonwebtoken");

// Falls back to a fixed dev secret if JWT_SECRET isn't set in .env, purely so the project
// runs out of the box for a quick demo. Always set a real JWT_SECRET in .env for anything
// beyond local testing.
const SECRET = process.env.JWT_SECRET || "krishiqueue_dev_only_secret_change_me";

function signToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role, name: user.name, mobile: user.mobile || null },
    SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
