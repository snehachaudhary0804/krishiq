const mongoose = require("mongoose");

const cropSchema = new mongoose.Schema(
 {
 name: { type: String, required: true, trim: true, unique: true },
 msp: { type: Number, required: true, min: 0.01 }, // MSP / rate per kg
 },
 { timestamps: true }
);

module.exports = mongoose.model("Crop", cropSchema);
