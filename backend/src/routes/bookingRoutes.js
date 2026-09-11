const express = require("express");
const {
  getSlots,
  createBooking,
  listBookings,
  listActiveBookings,
  myBookings,
  callToken,
  callNext,
  checkInByToken,
  startService,
  processBooking,
  markPaid,
  updatePaymentStatus,
  currentToken,
  refreshQueue,
} = require("../controllers/bookingController");
const { parseVoiceBooking } = require("../controllers/voiceBookingController");
const { protect, allowRoles } = require("../middleware/auth");

const router = express.Router();

// Public/farmer voice parsing route
router.post("/voice-parse", protect, parseVoiceBooking);

router.get("/slots", protect, getSlots);
router.get("/current", protect, currentToken);
router.get("/mine", protect, allowRoles("farmer"), myBookings);
router.get("/active", protect, allowRoles("operator", "admin"), listActiveBookings);
router.get("/", protect, allowRoles("operator", "admin"), listBookings);

router.post("/", protect, allowRoles("farmer"), createBooking);

router.patch("/call-next", protect, allowRoles("operator"), callNext);
router.patch("/check-in", protect, allowRoles("operator"), checkInByToken);
router.patch("/:id/call", protect, allowRoles("operator"), callToken);
router.patch("/:id/start-service", protect, allowRoles("operator"), startService);
router.patch("/:id/process", protect, allowRoles("operator"), processBooking);
router.patch("/:id/pay", protect, allowRoles("admin"), markPaid);
router.patch("/:id/payment-status", protect, allowRoles("admin"), updatePaymentStatus);
router.patch("/:id/refresh", protect, allowRoles("farmer"), refreshQueue);

module.exports = router;