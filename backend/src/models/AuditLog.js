const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
 {
 action: { type: String, required: true },
 entity: { type: String, default: "" },
 userName: { type: String, default: "" },
 role: { type: String, default: "" },
 },
 { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
