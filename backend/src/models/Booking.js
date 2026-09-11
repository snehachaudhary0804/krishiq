const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
 {
 token: { type: String, required: true, unique: true },
 farmer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
 farmerName: { type: String, required: true },
 mobile: { type: String, required: true, index: true },
 centre: { type: mongoose.Schema.Types.ObjectId, ref: "Centre", required: true },
 crop: { type: String, required: true },
 date: { type: String, required: true }, // YYYY-MM-DD
 slot: { type: String, required: true },
 quantity: { type: Number, required: true, min: 1 },
 position: { type: Number, required: true },
 status: {
 type: String,
 enum: [
 "BOOKED",
 "CALLED",
 "IN_SERVICE",
 "COMPLETED",
 "REJECTED",
 "CANCELLED",
 ],
 default: "BOOKED",
 index: true,
 },
 // procurement details
 grossWeight: { type: Number, default: null },
 tareWeight: { type: Number, default: null },
 weight: { type: Number, default: null }, // net weight
 quality: { type: String, enum: ["A", "B", "HOLD", "REJECTED", null], default: null },
 moisture: { type: Number, default: null },
 lot: { type: String, default: null },
 amount: { type: Number, default: null },
 payment: {
 type: String,
 enum: ["PAYMENT_PENDING", "PROCESSING", "PAID", "NOT_APPLICABLE", null],
 default: null,
 },
 },
 { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
