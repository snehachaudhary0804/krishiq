const Centre = require("../models/Centre");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { logAction } = require("../utils/audit");

async function listCentres(req, res) {
  const query = req.user?.role === "operator"
    ? (req.user.centre ? { _id: req.user.centre } : { _id: null })
    : {};
  const centres = await Centre.find(query)
    .populate("operator", "name employeeId")
    .sort({ createdAt: 1 });
  res.json({ centres });
}

async function createCentre(req, res) {
  try {
    const { name, district, distance, latitude, longitude, capacity, counters, cropList } = req.body;
    if (!name || !capacity) {
      return res.status(400).json({ message: "Centre name and capacity are required." });
    }
    const centre = await Centre.create({
      name: name.trim(),
      district: (district || "").trim(),
      distance: Number(distance) || 0,
      latitude: latitude !== undefined && latitude !== "" ? Number(latitude) : null,
      longitude: longitude !== undefined && longitude !== "" ? Number(longitude) : null,
      capacity: Number(capacity),
      counters: Number(counters) || 2,
      cropList: Array.isArray(cropList)
        ? cropList.map((c) => c.trim()).filter(Boolean)
        : String(cropList || "")
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
    });
    await logAction(req.user, "Created centre", centre._id);
    res.status(201).json({ centre });
  } catch (err) {
    res.status(500).json({ message: "Could not create centre.", error: err.message });
  }
}

async function updateCentre(req, res) {
  try {
    const centre = await Centre.findById(req.params.id);
    if (!centre) return res.status(404).json({ message: "Centre not found." });

    const { name, district, distance, latitude, longitude, capacity, counters, cropList, status } = req.body;
    if (name !== undefined) centre.name = name.trim();
    if (district !== undefined) centre.district = district.trim();
    if (distance !== undefined) centre.distance = Number(distance);
    if (latitude !== undefined) centre.latitude = latitude === "" ? null : Number(latitude);
    if (longitude !== undefined) centre.longitude = longitude === "" ? null : Number(longitude);
    if (capacity !== undefined) centre.capacity = Number(capacity);
    if (counters !== undefined) centre.counters = Number(counters);
    if (status !== undefined) centre.status = status;
    if (cropList !== undefined) {
      centre.cropList = Array.isArray(cropList)
        ? cropList.map((c) => c.trim()).filter(Boolean)
        : String(cropList)
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean);
    }
    await centre.save();
    await logAction(req.user, "Updated centre", centre._id);
    res.json({ centre });
  } catch (err) {
    res.status(500).json({ message: "Could not update centre.", error: err.message });
  }
}

async function deleteCentre(req, res) {
  try {
    const centre = await Centre.findByIdAndDelete(req.params.id);
    if (!centre) return res.status(404).json({ message: "Centre not found." });
    await logAction(req.user, "Deleted centre", req.params.id);
    res.json({ message: "Centre deleted." });
  } catch (err) {
    res.status(500).json({ message: "Could not delete centre.", error: err.message });
  }
}


async function listOperators(req, res) {
  try {
    const operators = await require("../models/User").find({ role: "operator" })
      .select("name employeeId centre")
      .populate("centre", "name");
    res.json({ operators });
  } catch (err) {
    res.status(500).json({ message: "Could not load operators.", error: err.message });
  }
}

async function assignOperator(req, res) {
  try {
    const User = require("../models/User");
    const Notification = require("../models/Notification");
    const { operatorId } = req.body;
    const centre = await Centre.findById(req.params.id);
    if (!centre) return res.status(404).json({ message: "Centre not found." });

    if (operatorId) {
      const operator = await User.findOne({ _id: operatorId, role: "operator" });
      if (!operator) return res.status(404).json({ message: "Operator not found." });

      if (operator.centre && String(operator.centre) !== String(centre._id)) {
        return res.status(409).json({ message: "This operator is already assigned to another centre." });
      }

      const existing = await Centre.findOne({ operator: operator._id, _id: { $ne: centre._id } });
      if (existing) {
        return res.status(409).json({ message: "This operator already manages another centre. One operator can have only one centre." });
      }

      if (centre.operator && String(centre.operator) !== String(operator._id)) {
        return res.status(409).json({ message: "This centre already has an operator assigned." });
      }

      centre.operator = operator._id;
      operator.centre = centre._id;
      await Promise.all([centre.save(), operator.save()]);

      const farmerCount = await require("../models/Booking").countDocuments({
        centre: centre._id,
        status: { $ne: "CANCELLED" },
      });

      await Notification.create({
        user: operator._id,
        text: `Your assigned centre is ${centre.name}. ${farmerCount} farmer${farmerCount === 1 ? "" : "s"} have applied/booked at this centre.`,
      });

      await logAction(req.user, `Assigned operator ${operator.employeeId} to centre`, centre._id);
      return res.json({ centre: await Centre.findById(centre._id).populate("operator", "name employeeId") });
    }

    if (centre.operator) {
      await User.findOneAndUpdate(
        { _id: centre.operator, role: "operator" },
        { $set: { centre: null } }
      );
    }
    centre.operator = null;
    await centre.save();
    await logAction(req.user, "Removed centre operator", centre._id);
    res.json({ centre });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "This centre is already assigned to an operator." });
    }
    res.status(500).json({ message: "Could not assign operator.", error: err.message });
  }
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function nearbyCentres(req, res) {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: "Latitude and longitude are required." });
    }

    const centres = await Centre.find({ status: { $ne: "Closed" } }).lean();
    const scored = centres.map((centre) => {
      const latC = Number(centre.latitude);
      const lngC = Number(centre.longitude);
      const distance = Number.isFinite(latC) && Number.isFinite(lngC)
        ? haversineKm(Number(lat), Number(lng), latC, lngC)
        : Number.MAX_SAFE_INTEGER;
      const crowdPenalty = centre.booked || 0;
      return { ...centre, distance, score: distance + crowdPenalty * 0.25 };
    }).sort((a, b) => a.score - b.score);

    res.json({ centres: scored });
  } catch (err) {
    res.status(500).json({ message: "Could not load nearby centres.", error: err.message });
  }
}

module.exports = {
  listCentres,
  createCentre,
  updateCentre,
  deleteCentre,
  nearbyCentres,
  listOperators,
  assignOperator,
};
