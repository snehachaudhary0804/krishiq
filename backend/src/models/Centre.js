const mongoose = require("mongoose");

const centreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    district: { type: String, trim: true, default: "" },
    distance: { type: Number, default: 0 },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    capacity: { type: Number, required: true, min: 1 },
    counters: { type: Number, required: true, min: 1, default: 2 },
    status: { type: String, enum: ["OPEN", "CLOSED"], default: "OPEN" },
    cropList: [{ type: String, trim: true }],
    // At most one operator can be assigned to a centre.
    operator: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, unique: true, sparse: true },
    booked: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Centre", centreSchema);
