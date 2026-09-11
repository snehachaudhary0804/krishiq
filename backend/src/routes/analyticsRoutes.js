const express = require("express");
const { summary } = require("../controllers/analyticsController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/summary", protect, allowRoles("admin"), summary);

module.exports = router;
