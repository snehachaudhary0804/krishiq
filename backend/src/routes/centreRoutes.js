const express = require("express");
const {
  listCentres,
  publicCentres,
  createCentre,
  updateCentre,
  deleteCentre,
  nearbyCentres,
  listOperators,
  assignOperator,
} = require("../controllers/centreController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/nearby", protect, nearbyCentres);
router.get("/operators", protect, allowRoles("admin"), listOperators);
router.get("/", protect, listCentres);
router.get("/public", publicCentres);
router.post("/", protect, allowRoles("admin"), createCentre);
router.put("/:id", protect, allowRoles("admin"), updateCentre);
router.patch("/:id/operator", protect, allowRoles("admin"), assignOperator);
router.delete("/:id", protect, allowRoles("admin"), deleteCentre);

module.exports = router;
