const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
 {
  mobile: { type: String, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, default: null },
  text: { type: String, required: true },
  read: { type: Boolean, default: false },
 },
 { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
