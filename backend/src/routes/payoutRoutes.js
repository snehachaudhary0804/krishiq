const express = require("express");
const { listPayouts } = require("../controllers/payoutController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, allowRoles("admin"), listPayouts);

module.exports = router;
