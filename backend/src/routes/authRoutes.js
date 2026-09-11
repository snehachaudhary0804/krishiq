const express = require("express");
const {
  requestFarmerOtp,
  verifyFarmerOtp,
  staffRegister,
  staffLogin,
  me,
  saveBankDetails,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");


const router = express.Router();
const { parseVoiceBooking } = require("../controllers/voiceBookingController");

// Protected or public route
router.post("/voice-parse", parseVoiceBooking);

router.post("/farmer/request-otp", requestFarmerOtp);
router.post("/farmer/verify-otp", verifyFarmerOtp);
router.post("/staff-register", staffRegister);
router.post("/staff-login", staffLogin);
router.get("/me", protect, me);
router.put("/bank-details", protect, saveBankDetails);

module.exports = router;