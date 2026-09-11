const express = require("express");
const { myNotifications } = require("../controllers/notificationController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", protect, allowRoles("farmer", "operator"), myNotifications);

module.exports = router;
