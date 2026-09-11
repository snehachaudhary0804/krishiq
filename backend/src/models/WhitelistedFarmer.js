const mongoose = require("mongoose");

const whitelistedFarmerSchema = new mongoose.Schema(
  {
    farmerId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    village: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WhitelistedFarmer", whitelistedFarmerSchema);