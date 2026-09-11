const AuditLog = require("../models/AuditLog");

async function logAction(user, action, entity = "") {
 try {
 await AuditLog.create({
 action,
 entity: String(entity),
 userName: user?.name || "system",
 role: user?.role || "system",
 });
 } catch (err) {
 console.error("Audit log failed:", err.message);
 }
}

module.exports = { logAction };
