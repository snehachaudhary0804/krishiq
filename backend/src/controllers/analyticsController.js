const Booking = require("../models/Booking");
const Centre = require("../models/Centre");

async function summary(req, res) {
  try {
    const [statusBreakdown, cropRevenue, centreVolume, last7Days, paymentBreakdown, totals] = await Promise.all([
      Booking.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),

      Booking.aggregate([
        { $match: { status: "COMPLETED" } },
        { $group: { _id: "$crop", revenue: { $sum: "$amount" }, weight: { $sum: "$weight" } } },
        { $sort: { revenue: -1 } },
      ]),

      Booking.aggregate([
        { $group: { _id: "$centre", count: { $sum: 1 } } },
        { $lookup: { from: "centres", localField: "_id", foreignField: "_id", as: "centre" } },
        { $unwind: { path: "$centre", preserveNullAndEmptyArrays: true } },
        { $project: { count: 1, name: { $ifNull: ["$centre.name", "Deleted centre"] } } },
      ]),

      Booking.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Booking.aggregate([{ $group: { _id: "$payment", count: { $sum: 1 }, amount: { $sum: "$amount" } } }]),

      Booking.aggregate([
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalWeight: { $sum: "$weight" },
            totalRevenue: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    res.json({
      statusBreakdown,
      cropRevenue,
      centreVolume,
      last7Days,
      paymentBreakdown,
      totals: totals[0] || { totalBookings: 0, totalWeight: 0, totalRevenue: 0 },
    });
  } catch (err) {
    res.status(500).json({ message: "Could not load analytics.", error: err.message });
  }
}

module.exports = { summary };
