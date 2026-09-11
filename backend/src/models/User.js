const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
 {
 role: {
 type: String,
 enum: ["farmer", "operator", "admin"],
 required: true,
 },
 name: { type: String, required: true, trim: true },
 // In models/User.js under userSchema:
farmerId: { type: String, trim: true, sparse: true, index: true },
 // Farmers login with mobile number, staff (operator/admin) with employeeId + password
 mobile: { type: String, trim: true, sparse: true, index: true },
 village: { type: String, trim: true },
 employeeId: { type: String, trim: true, sparse: true, index: true },
 passwordHash: { type: String, select: false },
 centre: { type: mongoose.Schema.Types.ObjectId, ref: "Centre", default: null },
 bankDetails: {
 accountHolderName: { type: String, trim: true, default: "" },
 accountNumber: { type: String, trim: true, default: "" },
 ifsc: { type: String, trim: true, default: "" },
 bankName: { type: String, trim: true, default: "" },
 },
 },
 { timestamps: true }
);

// A mobile number is unique among farmers, an employeeId unique among staff
userSchema.index({ role: 1, mobile: 1 }, { unique: true, partialFilterExpression: { mobile: { $type: "string" } } });
userSchema.index({ role: 1, employeeId: 1 }, { unique: true, partialFilterExpression: { employeeId: { $type: "string" } } });

module.exports = mongoose.model("User", userSchema);
