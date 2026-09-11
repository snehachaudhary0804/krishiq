const Payout = require("../models/Payout");

async function listPayouts(req, res) {
  const payouts = await Payout.find()
    .populate("farmer", "name mobile")
    .populate("booking", "token crop amount")
    .sort({ createdAt: -1 });
  res.json({ payouts });
}

module.exports = { listPayouts };
