const AuditLog = require("../models/AuditLog");

async function listAudit(req, res) {
 const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(200);
 res.json({ logs });
}

async function listMyAudit(req, res) {
 const logs = await AuditLog.find({
   userName: req.user.name,
   role: req.user.role,
 }).sort({ createdAt: -1 }).limit(100);
 res.json({ logs });
}

module.exports = { listAudit, listMyAudit };
