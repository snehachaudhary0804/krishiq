const Crop = require("../models/Crop");
const { logAction } = require("../utils/audit");

async function listCrops(req, res) {
 const crops = await Crop.find().sort({ name: 1 });
 res.json({ crops });
}

async function createCrop(req, res) {
 try {
 const { name, msp } = req.body;
 if (!name || !msp || Number(msp) <= 0) {
 return res.status(400).json({ message: "Crop name and a valid MSP rate are required." });
 }
 const existing = await Crop.findOne({ name: name.trim() });
 if (existing) {
 existing.msp = Number(msp);
 await existing.save();
 await logAction(req.user, "Updated crop/MSP", existing._id);
 return res.json({ crop: existing });
 }
 const crop = await Crop.create({ name: name.trim(), msp: Number(msp) });
 await logAction(req.user, "Added crop/MSP", crop._id);
 res.status(201).json({ crop });
 } catch (err) {
 res.status(500).json({ message: "Could not save crop.", error: err.message });
 }
}

async function deleteCrop(req, res) {
 try {
 const crop = await Crop.findByIdAndDelete(req.params.id);
 if (!crop) return res.status(404).json({ message: "Crop not found." });
 await logAction(req.user, "Deleted crop/MSP", crop.name);
 res.json({ message: "Crop deleted." });
 } catch (err) {
 res.status(500).json({ message: "Could not delete crop.", error: err.message });
 }
}

module.exports = { listCrops, createCrop, deleteCrop };
