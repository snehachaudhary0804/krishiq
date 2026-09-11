const Notification = require("../models/Notification");

async function myNotifications(req, res) {
 const query = req.user.role === "farmer"
   ? { mobile: req.user.mobile }
   : { user: req.user._id };
 const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(50);
 res.json({ notifications });
}

module.exports = { myNotifications };
