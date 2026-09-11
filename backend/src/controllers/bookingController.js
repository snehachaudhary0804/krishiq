const Booking = require("../models/Booking");
const Centre = require("../models/Centre");
const Crop = require("../models/Crop");
const User = require("../models/User");
const Payout = require("../models/Payout");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");

const { logAction } = require("../utils/audit");
const { emitQueueUpdate } = require("../utils/socket");
const {
  isRazorpayConfigured,
  sendRealPayout,
} = require("../utils/razorpayPayout");

const SLOT_TIMES = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 01:00",
  "02:00 - 03:00",
  "03:00 - 04:00",
  "04:00 - 05:00",
];

const ACTIVE_STATUSES = [
  "BOOKED",
  "CALLED",
  "IN_SERVICE",
];

function operatorCentreId(req) {
  return req.user?.role === "operator"
    ? req.user.centre
    : null;
}

function assertOperatorCentre(req, booking) {
  if (req.user.role !== "operator") {
    return null;
  }

  if (!req.user.centre) {
    return "You are not assigned to a procurement centre yet.";
  }

  if (
    !booking ||
    String(booking.centre) !== String(req.user.centre)
  ) {
    return "You can only access bookings from your assigned centre.";
  }

  return null;
}

function money(n) {
  return n == null
    ? "-"
    : `Rs. ${Number(n).toLocaleString("en-IN")}`;
}

function maskAccount(num) {
  if (!num) return "";

  const s = String(num);

  return s.length <= 4
    ? s
    : "X".repeat(s.length - 4) + s.slice(-4);
}


/* =========================================================
   GET SLOTS
   GET /api/bookings/slots?centreId=&date=
========================================================= */

async function getSlots(req, res) {
  try {
    const { centreId, date } = req.query;

    if (!centreId || !date) {
      return res.status(400).json({
        message: "centreId and date are required.",
      });
    }

    const centre = await Centre.findById(centreId);

    if (!centre) {
      return res.status(404).json({
        message: "Centre not found.",
      });
    }

    const cap = Math.max(
      1,
      Math.floor(centre.capacity / SLOT_TIMES.length)
    );

    const slots = await Promise.all(
      SLOT_TIMES.map(async (t) => {
        const used = await Booking.countDocuments({
          centre: centreId,
          date,
          slot: t,
          status: { $ne: "CANCELLED" },
        });

        return {
          time: t,
          used,
          capacity: cap,
          left: Math.max(0, cap - used),
        };
      })
    );

    res.json({ slots });
  } catch (err) {
    res.status(500).json({
      message: "Could not load slots.",
      error: err.message,
    });
  }
}


/* =========================================================
   CREATE BOOKING
   POST /api/bookings
   Farmer only
========================================================= */

async function createBooking(req, res) {
  try {
    const user = req.user;

    if (user.role !== "farmer") {
      return res.status(403).json({
        message: "Only farmers can book a token.",
      });
    }

    const {
      centreId,
      crop,
      date,
      slot,
      quantity,
    } = req.body;

    if (
      !centreId ||
      !crop ||
      !date ||
      !slot ||
      !quantity
    ) {
      return res.status(400).json({
        message:
          "Centre, crop, date, slot and quantity are all required.",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        message: "Enter a valid expected quantity.",
      });
    }

    const centre = await Centre.findById(centreId);

    if (!centre) {
      return res.status(404).json({
        message: "Selected centre not found.",
      });
    }

    const cropDoc = await Crop.findOne({
      name: crop,
    });

    if (!cropDoc) {
      return res.status(400).json({
        message:
          "Selected crop is not configured with an MSP.",
      });
    }

    const duplicate = await Booking.findOne({
      mobile: user.mobile,
      date,
      status: { $ne: "CANCELLED" },
    });

    if (duplicate) {
      return res.status(409).json({
        message:
          "You already have a booking for this date.",
      });
    }

    const cap = Math.max(
      1,
      Math.floor(centre.capacity / SLOT_TIMES.length)
    );

    const sameSlotCount = await Booking.countDocuments({
      centre: centre._id,
      date,
      slot,
      status: { $ne: "CANCELLED" },
    });

    if (sameSlotCount >= cap) {
      return res.status(409).json({
        message:
          "Selected slot is full. Please choose another.",
      });
    }

    const position =
      (
        await Booking.countDocuments({
          centre: centre._id,
          date,
          status: { $in: ACTIVE_STATUSES },
        })
      ) + 1;

    const seqCount = await Booking.countDocuments();

    const token =
      "T-" +
      String(seqCount + 1).padStart(4, "0");

    const booking = await Booking.create({
      token,
      farmer: user._id,
      farmerName: user.name,
      mobile: user.mobile,
      centre: centre._id,
      crop,
      date,
      slot,
      quantity: Number(quantity),
      position,
      status: "BOOKED",
    });

    centre.booked = (centre.booked || 0) + 1;

    await centre.save();

    await Notification.create({
      mobile: user.mobile,
      text: `Token ${token} booked for ${date}, ${slot}.`,
    });

    /*
      Notify only the operator assigned to this centre.
    */
    if (centre.operator) {
      const farmerCount =
        await Booking.countDocuments({
          centre: centre._id,
          status: { $ne: "CANCELLED" },
        });

      await Notification.create({
        user: centre.operator,
        text:
          `New farmer application at ${centre.name}. ` +
          `Total farmers booked at your centre: ${farmerCount}.`,
      });
    }

    await logAction(
      user,
      "Token booked",
      booking._id
    );

    emitQueueUpdate(
      "booking:created",
      {
        bookingId: booking._id,
        centreId: centre._id,
      }
    );

    res.status(201).json({
      booking,
    });
  } catch (err) {
    res.status(500).json({
      message: "Could not create booking.",
      error: err.message,
    });
  }
}


/* =========================================================
   LIST ALL BOOKINGS
========================================================= */

async function listBookings(req, res) {
  try {
    const { centreId, status, search, date } = req.query;
    const filter = req.user.role === "operator"
      ? { centre: operatorCentreId(req) || null }
      : {};

    if (centreId) {
      if (!mongoose.Types.ObjectId.isValid(centreId)) {
        return res.status(400).json({ message: "Invalid centre." });
      }
      filter.centre = centreId;
    }
    if (status) filter.status = status;
    if (date) filter.date = date;
    if (search?.trim()) {
      const pattern = new RegExp(search.trim().replace(/[^a-zA-Z0-9 _-]/g, ""), "i");
      filter.$or = [
        { token: pattern },
        { farmerName: pattern },
        { mobile: pattern },
        { crop: pattern },
      ];
    }

    const bookings = await Booking.find(filter)
      .populate("centre", "name")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: "Could not load bookings.", error: err.message });
  }
}

async function listActiveBookings(req, res) {
  const filter = {
    status: {
      $in: ACTIVE_STATUSES,
    },
  };

  if (req.user.role === "operator") {
    filter.centre =
      operatorCentreId(req) || null;
  }

  const bookings = await Booking.find(filter)
    .populate("centre", "name")
    .sort({ position: 1 });

  res.json({
    bookings,
  });
}


/* =========================================================
   FARMER BOOKINGS
========================================================= */

async function myBookings(req, res) {
  const user = req.user;

  const active = await Booking.findOne({
    mobile: user.mobile,
    status: {
      $in: [
        ...ACTIVE_STATUSES,
        "PAYMENT_PENDING",
      ],
    },
  }).populate(
    "centre",
    "name district"
  );

  const history = await Booking.find({
    mobile: user.mobile,
  })
    .populate("centre", "name")
    .sort({ createdAt: -1 });

  res.json({
    active,
    history,
  });
}


/* =========================================================
   CALL SPECIFIC TOKEN
   BOOKED -> CALLED
========================================================= */

async function callToken(req, res) {
  try {
    const booking =
      await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    const accessError =
      assertOperatorCentre(
        req,
        booking
      );

    if (accessError) {
      return res.status(403).json({
        message: accessError,
      });
    }

    /*
      Only BOOKED tokens can be called.
      This prevents accidentally changing
      IN_SERVICE back to CALLED.
    */
    if (booking.status !== "BOOKED") {
      return res.status(409).json({
        message:
          `This token is currently ${booking.status}. ` +
          `Only BOOKED tokens can be called.`,
      });
    }

    booking.status = "CALLED";

    await booking.save();

    /*
      Notify farmer that their token is called.
    */
    await Notification.create({
      mobile: booking.mobile,
      text:
        `Your token ${booking.token} has been called. ` +
        `Please proceed to the procurement desk.`,
    });

    await logAction(
      req.user,
      "Called token",
      booking._id
    );

    emitQueueUpdate(
      "booking:updated",
      {
        bookingId: booking._id,
        status: "CALLED",
      }
    );

    res.json({
      booking,
    });
  } catch (err) {
    res.status(500).json({
      message: "Could not call token.",
      error: err.message,
    });
  }
}


/* =========================================================
   CALL NEXT TOKEN
   BOOKED -> CALLED
========================================================= */

async function callNext(req, res) {
  try {
    const filter = {
      status: "BOOKED",
    };

    if (req.user.role === "operator") {
      filter.centre =
        operatorCentreId(req) || null;
    }

    const booking =
      await Booking.findOne(filter)
        .sort({ position: 1 });

    if (!booking) {
      return res.status(404).json({
        message:
          "No waiting token to call.",
      });
    }

    booking.status = "CALLED";

    await booking.save();

    await Notification.create({
      mobile: booking.mobile,
      text:
        `Your token ${booking.token} has been called. ` +
        `Please proceed to the procurement desk.`,
    });

    await logAction(
      req.user,
      "Called token",
      booking._id
    );

    emitQueueUpdate(
      "booking:updated",
      {
        bookingId: booking._id,
        status: "CALLED",
      }
    );

    res.json({
      booking,
    });
  } catch (err) {
    res.status(500).json({
      message:
        "Could not call next token.",
      error: err.message,
    });
  }
}


/* =========================================================
   CHECK-IN BY TOKEN / QR
   BOOKED -> CALLED
========================================================= */

async function checkInByToken(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Token is required.",
      });
    }

    const booking =
      await Booking.findOne({
        token: token.trim(),
      });

    if (!booking) {
      return res.status(404).json({
        message:
          "No booking found for this token.",
      });
    }

    const accessError =
      assertOperatorCentre(
        req,
        booking
      );

    if (accessError) {
      return res.status(403).json({
        message: accessError,
      });
    }

    /*
      QR check-in should only work for
      a waiting BOOKED farmer.
    */
    if (booking.status !== "BOOKED") {
      return res.status(409).json({
        message:
          `This token is already ${booking.status}.`,
      });
    }

    booking.status = "CALLED";

    await booking.save();

    await Notification.create({
      mobile: booking.mobile,
      text:
        `Token ${booking.token} checked in successfully. ` +
        `Please proceed to the procurement desk.`,
    });

    await logAction(
      req.user,
      "Checked in via QR scan",
      booking._id
    );

    emitQueueUpdate(
      "booking:updated",
      {
        bookingId: booking._id,
        status: "CALLED",
      }
    );

    res.json({
      booking,
    });
  } catch (err) {
    res.status(500).json({
      message: "Check-in failed.",
      error: err.message,
    });
  }
}


/* =========================================================
   START SERVICE
   CALLED -> IN_SERVICE
========================================================= */

async function startService(req, res) {
  try {
    const booking =
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    const accessError =
      assertOperatorCentre(
        req,
        booking
      );

    if (accessError) {
      return res.status(403).json({
        message: accessError,
      });
    }

    /*
      Start Service should only happen
      after the farmer has been CALLED.
    */
    if (booking.status !== "CALLED") {
      return res.status(409).json({
        message:
          `Cannot start service because this token is ${booking.status}. ` +
          `Call the farmer first.`,
      });
    }

    booking.status = "IN_SERVICE";

    await booking.save();

    /*
      Notify farmer that service has started.
    */
    await Notification.create({
      mobile: booking.mobile,
      text:
        `Token ${booking.token} is now in service. ` +
        `Please proceed to the procurement desk.`,
    });

    /*
      Save operator activity in audit.
    */
    await logAction(
      req.user,
      "Started procurement service",
      booking._id
    );

    /*
      Send live update to dashboard / queue.
    */
    emitQueueUpdate(
      "booking:updated",
      {
        bookingId: booking._id,
        status: "IN_SERVICE",
      }
    );

    res.json({
      booking,
    });
  } catch (err) {
    res.status(500).json({
      message:
        "Could not start service.",
      error: err.message,
    });
  }
}


/* =========================================================
   PROCESS PROCUREMENT
   IN_SERVICE -> COMPLETED / REJECTED
========================================================= */

async function processBooking(req, res) {
  try {
    const {
      grossWeight,
      tareWeight,
      quality,
      moisture,
    } = req.body;

    const booking =
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    const accessError =
      assertOperatorCentre(
        req,
        booking
      );

    if (accessError) {
      return res.status(403).json({
        message: accessError,
      });
    }

    /*
      Procurement should normally happen
      only when farmer is IN_SERVICE.
    */
    if (booking.status !== "IN_SERVICE") {
      return res.status(409).json({
        message:
          `Procurement cannot be completed because this token is ${booking.status}.`,
      });
    }

    const gross = Number(grossWeight);
    const tare = Number(tareWeight) || 0;
    const net = gross - tare;

    if (!gross || net <= 0) {
      return res.status(400).json({
        message:
          "Invalid weight values.",
      });
    }

    booking.grossWeight = gross;
    booking.tareWeight = tare;
    booking.weight = net;
    booking.quality = quality;
    booking.moisture =
      Number(moisture) || null;

    /*
      REJECTED PROCUREMENT
    */
    if (quality === "REJECTED") {
      booking.status = "REJECTED";
      booking.payment =
        "NOT_APPLICABLE";
    }

    /*
      SUCCESSFUL PROCUREMENT
    */
    else {
      const cropDoc =
        await Crop.findOne({
          name: booking.crop,
        });

      const rate =
        cropDoc ? cropDoc.msp : 0;

      booking.status = "COMPLETED";

      booking.lot =
        "LOT-" +
        Date.now()
          .toString()
          .slice(-6);

      booking.amount =
        Math.round(net * rate);

      booking.payment =
        "PAYMENT_PENDING";
    }

    await booking.save();

    await logAction(
      req.user,
      "Procurement completed",
      booking._id
    );

    emitQueueUpdate(
      "booking:updated",
      {
        bookingId: booking._id,
        status: booking.status,
      }
    );

    res.json({
      booking,
    });
  } catch (err) {
    res.status(500).json({
      message:
        "Could not save procurement.",
      error: err.message,
    });
  }
}


/* =========================================================
   MARK PAID
   PATCH /api/bookings/:id/pay
   ADMIN ONLY
========================================================= */

async function markPaid(req, res) {
  try {
    const booking =
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    if (
      booking.payment !==
      "PAYMENT_PENDING"
    ) {
      return res.status(409).json({
        message:
          "This booking has no pending payment.",
      });
    }

    const farmer =
      await User.findById(
        booking.farmer
      );

    if (
      !farmer ||
      !farmer.bankDetails?.accountNumber
    ) {
      return res.status(400).json({
        message:
          "Farmer has not added bank details yet. Ask them to add it from their dashboard first.",
      });
    }

    const referenceId =
      String(booking._id);

    let payout;

    /*
      REAL RAZORPAY PAYOUT
    */
    if (isRazorpayConfigured()) {
      try {
        const result =
          await sendRealPayout({
            farmerName: farmer.name,
            mobile: farmer.mobile,
            bankDetails:
              farmer.bankDetails,
            amount: booking.amount,
            referenceId,
            narration:
              `Procurement payment for token ${booking.token}`,
          });

        payout =
          await Payout.create({
            booking: booking._id,
            farmer: farmer._id,
            amount: booking.amount,
            mode: "REAL",

            status:
              result.status === "processed" ||
              result.status === "queued"
                ? "SUCCESS"
                : "PROCESSING",

            razorpayPayoutId:
              result.payoutId,

            razorpayFundAccountId:
              result.fundAccountId,

            accountNumberMasked:
              maskAccount(
                farmer.bankDetails
                  .accountNumber
              ),
          });

        booking.payment = "PAID";
      } catch (payoutErr) {
        payout =
          await Payout.create({
            booking: booking._id,
            farmer: farmer._id,
            amount: booking.amount,
            mode: "REAL",
            status: "FAILED",
            failureReason:
              payoutErr.message,

            accountNumberMasked:
              maskAccount(
                farmer.bankDetails
                  .accountNumber
              ),
          });

        return res.status(502).json({
          message:
            `Real payout failed: ${payoutErr.message}`,
          payout,
        });
      }
    }

    /*
      DEMO MODE
    */
    else {
      payout =
        await Payout.create({
          booking: booking._id,
          farmer: farmer._id,
          amount: booking.amount,
          mode: "DEMO",
          status: "SUCCESS",

          accountNumberMasked:
            maskAccount(
              farmer.bankDetails
                .accountNumber
            ),
        });

      booking.payment = "PAID";
    }

    await booking.save();

    await Notification.create({
      mobile: booking.mobile,

      text:
        `Payment of ${money(
          booking.amount
        )} sent for token ${
          booking.token
        } to account ${maskAccount(
          farmer.bankDetails
            .accountNumber
        )} (${
          payout.mode === "REAL"
            ? "bank transfer"
            : "demo mode"
        }).`,
    });

    await logAction(
      req.user,
      payout.mode === "REAL"
        ? "Payout sent"
        : "Payout simulated",
      booking._id
    );

    emitQueueUpdate(
      "booking:updated",
      {
        bookingId: booking._id,
        status: booking.status,
      }
    );

    res.json({
      booking,
      payout,
    });
  } catch (err) {
    res.status(500).json({
      message:
        "Could not process payment.",
      error: err.message,
    });
  }
}


/* =========================================================
   CURRENT TOKEN
========================================================= */

/* =========================================================
   UPDATE PAYMENT STATUS (manual admin tracking)
   PATCH /api/bookings/:id/payment-status
   body: { status: "PROCESSING" | "PAID" }

   Used when the government transfers procurement funds to the
   farmer's bank account outside the system. Admin tracks that
   transfer here so the farmer is notified and can then download
   their receipt.
========================================================= */

const PAYMENT_TRANSITIONS = {
  PAYMENT_PENDING: ["PROCESSING", "PAID"],
  PROCESSING: ["PAID"],
};

async function updatePaymentStatus(req, res) {
  try {
    const { status } = req.body;

    if (!["PROCESSING", "PAID"].includes(status)) {
      return res.status(400).json({
        message: "Status must be PROCESSING or PAID.",
      });
    }

    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    const allowedNext =
      PAYMENT_TRANSITIONS[booking.payment] || [];

    if (!allowedNext.includes(status)) {
      return res.status(409).json({
        message: `Cannot move payment from ${booking.payment || "N/A"} to ${status}.`,
      });
    }

    booking.payment = status;
    await booking.save();

    const farmer = await User.findById(booking.farmer);

    let payout = null;

    if (status === "PAID") {
      payout = await Payout.create({
        booking: booking._id,
        farmer: booking.farmer,
        amount: booking.amount,
        mode: "DEMO",
        status: "SUCCESS",
        accountNumberMasked: maskAccount(
          farmer?.bankDetails?.accountNumber
        ),
      });
    }

    const notificationText =
      status === "PROCESSING"
        ? `Your payment for token ${booking.token} is being processed by the government. You'll be notified once it's credited.`
        : `Payment of ${money(booking.amount)} has been credited to your account for token ${booking.token}. You can now download your receipt.`;

    await Notification.create({
      mobile: booking.mobile,
      text: notificationText,
    });

    await logAction(
      req.user,
      status === "PROCESSING"
        ? "Payment marked as processing"
        : "Payment marked as paid (govt transfer)",
      booking._id
    );

    emitQueueUpdate("booking:updated", {
      bookingId: booking._id,
      status: booking.status,
    });

    res.json({ booking, payout });
  } catch (err) {
    res.status(500).json({
      message: "Could not update payment status.",
      error: err.message,
    });
  }
}

async function currentToken(req, res) {
  const filter = {
    status: {
      $in: [
        "CALLED",
        "IN_SERVICE",
      ],
    },
  };

  if (req.user.role === "operator") {
    filter.centre =
      operatorCentreId(req) || null;
  }

  const booking =
    await Booking.findOne(filter)
      .sort({ updatedAt: -1 });

  res.json({
    current:
      booking
        ? booking.token
        : null,
  });
}


/* =========================================================
   REFRESH FARMER QUEUE
========================================================= */

async function refreshQueue(req, res) {
  try {
    const booking =
      await Booking.findById(
        req.params.id
      );

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found.",
      });
    }

    if (
      booking.mobile !==
      req.user.mobile
    ) {
      return res.status(403).json({
        message: "Not your booking.",
      });
    }

    if (booking.position > 1) {
      booking.position -= 1;

      if (
        booking.position === 1 &&
        booking.status === "BOOKED"
      ) {
        booking.status = "CALLED";

        await Notification.create({
          mobile: booking.mobile,
          text:
            `Your turn: ${booking.token} is being called.`,
        });

        await logAction(
          req.user,
          "Token called",
          booking._id
        );
      }

      await booking.save();

      emitQueueUpdate(
        "booking:updated",
        {
          bookingId: booking._id,
          status: booking.status,
        }
      );
    }

    res.json({
      booking,
    });
  } catch (err) {
    res.status(500).json({
      message:
        "Could not refresh queue.",
      error: err.message,
    });
  }
}


/* =========================================================
   EXPORTS
========================================================= */

module.exports = {
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
};