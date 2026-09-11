const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
 {
 booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
 farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
 amount: { type: Number, required: true },
 mode: { type: String, enum: ["REAL", "DEMO"], required: true },
 status: { type: String, enum: ["PROCESSING", "SUCCESS", "FAILED"], default: "PROCESSING" },
 razorpayPayoutId: { type: String, default: null },
 razorpayFundAccountId: { type: String, default: null },
 failureReason: { type: String, default: null },
 accountNumberMasked: { type: String, default: "" },
 },
 { timestamps: true }
);

module.exports = mongoose.model("Payout", payoutSchema);
