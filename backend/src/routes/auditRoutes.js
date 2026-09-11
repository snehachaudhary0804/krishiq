const express = require("express");
const { listAudit, listMyAudit } = require("../controllers/auditController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/mine", protect, allowRoles("operator"), listMyAudit);
router.get("/", protect, allowRoles("admin"), listAudit);

module.exports = router;
