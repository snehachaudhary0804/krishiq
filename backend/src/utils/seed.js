/**
 * Optional helper: creates one demo Admin account, one Operator account,
 * one Centre and one Crop/MSP so the app isn't completely empty on first run.
 * Run with: npm run seed
 *
 * Admin and Operator IDs must end with "@admin" / "@operator" - this is enforced
 * by the backend on every login and registration attempt.
 */
require("dotenv").config();
const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");
const Centre = require("../models/Centre");
const Crop = require("../models/Crop");

async function seed() {
  await connectDB();

  const adminExists = await User.findOne({ role: "admin", employeeId: "agency@admin" });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await User.create({ role: "admin", name: "Agency Admin", employeeId: "agency@admin", passwordHash });
    console.log("Demo admin created -> ID: agency@admin / password: admin123");
  }

  let opExists = await User.findOne({ role: "operator", employeeId: "desk1@operator" });
  if (!opExists) {
    const passwordHash = await bcrypt.hash("operator123", 10);
    opExists = await User.create({ role: "operator", name: "Centre Operator", employeeId: "desk1@operator", passwordHash });
    console.log("Demo operator created -> ID: desk1@operator / password: operator123");
  }

  let centreExists = await Centre.findOne({ name: "Bareilly Mandi Procurement Centre" });
  if (!centreExists) {
    centreExists = await Centre.create({
      name: "Bareilly Mandi Procurement Centre",
      district: "Bareilly",
      distance: 4,
      capacity: 70,
      counters: 2,
      status: "OPEN",
      cropList: ["Wheat", "Paddy"],
    });
    console.log("Demo centre created");
  }

  // Keep the demo login immediately usable: assign the demo operator to the
  // demo centre when both are available and neither is already assigned elsewhere.
  if (!opExists.centre && !centreExists.operator) {
    opExists.centre = centreExists._id;
    centreExists.operator = opExists._id;
    await Promise.all([opExists.save(), centreExists.save()]);
    console.log("Demo operator assigned -> Bareilly Mandi Procurement Centre");
  } else if (opExists.centre && String(opExists.centre) === String(centreExists._id) &&
             (!centreExists.operator || String(centreExists.operator) !== String(opExists._id))) {
    centreExists.operator = opExists._id;
    await centreExists.save();
  } else if (!opExists.centre && centreExists.operator && String(centreExists.operator) === String(opExists._id)) {
    opExists.centre = centreExists._id;
    await opExists.save();
  }

  const cropExists = await Crop.findOne({ name: "Wheat" });
  if (!cropExists) {
    await Crop.create({ name: "Wheat", msp: 2425 });
    await Crop.create({ name: "Paddy", msp: 2300 });
    console.log("Demo crops/MSP created");
  }

  console.log("Seeding complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
