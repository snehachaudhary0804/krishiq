const express = require("express");
const { listCrops, createCrop, deleteCrop } = require("../controllers/cropController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, listCrops);
router.post("/", protect, allowRoles("admin"), createCrop);
router.delete("/:id", protect, allowRoles("admin"), deleteCrop);

module.exports = router;
