const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/User");
const Otp = require("../models/Otp");
const { signToken } = require("../utils/token");
const { logAction } = require("../utils/audit");
const { sendOtpSms, isSmsConfigured } = require("../utils/sms");
const WhitelistedFarmer = require("../models/WhitelistedFarmer");

const OTP_TTL_MINUTES = 5;

function idMatchesRole(role, employeeId) {
  return employeeId.trim().toLowerCase().endsWith(`@${role}`);
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

// STEP 1: Verify Farmer ID + Mobile against Whitelist, then issue OTP
async function requestFarmerOtp(req, res) {
  try {
    const { farmerId, mobile } = req.body;
    if (!farmerId || !mobile) {
      return res.status(400).json({ message: "Farmer ID and Mobile number are required." });
    }

    const cleanFarmerId = farmerId.trim().toUpperCase();
    const cleanMobile = mobile.trim();

    const whitelisted = await WhitelistedFarmer.findOne({ farmerId: cleanFarmerId });
    if (!whitelisted) {
      return res.status(403).json({ message: "Invalid Farmer ID. Not found in official registry." });
    }

    if (whitelisted.mobile !== cleanMobile) {
      return res.status(403).json({ message: "Mobile number does not match official records for this Farmer ID." });
    }

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    await Otp.create({ mobile: cleanMobile, code, expiresAt });
    // Still calls sendOtpSms — this logs "[DEMO SMS] OTP for <mobile>: <code>" to the
    // backend terminal/Render logs when SMS isn't configured, exactly as before.
    await sendOtpSms(cleanMobile, code);

    // Response no longer reveals demo mode or the OTP value to the frontend.
    return res.json({
      message: "OTP sent to your mobile number.",
      demoMode: false,
      demoOtp: undefined,
      autoName: whitelisted.name,
      autoVillage: whitelisted.village,
    });
  } catch (err) {
    return res.status(500).json({ message: "Could not send OTP.", error: err.message });
  }
}

// STEP 2: Verify OTP and create/update session
async function verifyFarmerOtp(req, res) {
  try {
    const { farmerId, mobile, otp, name, village } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ message: "Mobile number and OTP are required." });
    }

    const cleanMobile = mobile.trim();
    const record = await Otp.findOne({ mobile: cleanMobile, code: String(otp).trim(), consumed: false }).sort({
      createdAt: -1,
    });

    if (!record) return res.status(401).json({ message: "Invalid OTP." });
    if (record.expiresAt < new Date()) return res.status(401).json({ message: "OTP expired. Please request a new one." });

    record.consumed = true;
    await record.save();

    let user = await User.findOne({ role: "farmer", mobile: cleanMobile });
    if (!user) {
      user = await User.create({
        role: "farmer",
        farmerId: (farmerId || "").trim().toUpperCase(),
        name: (name || "").trim(),
        mobile: cleanMobile,
        village: (village || "").trim(),
      });
      await logAction(user, "Farmer registered (OTP verified)", user._id);
    } else {
      if (farmerId) user.farmerId = farmerId.trim().toUpperCase();
      if (name) user.name = name.trim();
      if (village) user.village = village.trim();
      await user.save();
    }

    const token = signToken(user);
    return res.json({ token, user: sanitize(user) });
  } catch (err) {
    return res.status(500).json({ message: "OTP verification failed.", error: err.message });
  }
}

// Staff Registration
async function staffRegister(req, res) {
  try {
    const { role, name, employeeId, password } = req.body;
    if (!["operator", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be operator or admin." });
    }
    if (!name || !employeeId || !password) {
      return res.status(400).json({ message: "Name, ID and password are required." });
    }
    if (!idMatchesRole(role, employeeId)) {
      return res.status(403).json({
        message: `You are not authorized to register as ${role}. Your ID must end with "@${role}" (e.g. name@${role}).`,
      });
    }

    const existing = await User.findOne({ role, employeeId: employeeId.trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: "This ID is already registered." });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      role,
      name: name.trim(),
      employeeId: employeeId.trim().toLowerCase(),
      passwordHash,
    });

    await logAction(user, `${role === "admin" ? "Admin" : "Operator"} account created`, user._id);

    const token = signToken(user);
    return res.status(201).json({ token, user: sanitize(user) });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed.", error: err.message });
  }
}

// Staff Login
async function staffLogin(req, res) {
  try {
    const { role, employeeId, password } = req.body;
    if (!["operator", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be operator or admin." });
    }
    if (!employeeId || !password) {
      return res.status(400).json({ message: "ID and password are required." });
    }
    if (!idMatchesRole(role, employeeId)) {
      return res.status(403).json({
        message: `You are not ${role}. This ID cannot log in as ${role} (it must end with "@${role}").`,
      });
    }

    const user = await User.findOne({ role, employeeId: employeeId.trim().toLowerCase() }).select("+passwordHash");
    if (!user) return res.status(401).json({ message: "Invalid ID or password." });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: "Invalid ID or password." });

    const token = signToken(user);
    return res.json({ token, user: sanitize(user) });
  } catch (err) {
    return res.status(500).json({ message: "Login failed.", error: err.message });
  }
}

async function me(req, res) {
  return res.json({ user: sanitize(req.user) });
}

// Farmer Bank Details
async function saveBankDetails(req, res) {
  try {
    if (req.user.role !== "farmer") return res.status(403).json({ message: "Only farmers have bank details." });
    const { accountHolderName, accountNumber, ifsc, bankName } = req.body;
    if (!accountHolderName || !accountNumber || !ifsc || !bankName) {
      return res.status(400).json({ message: "All bank detail fields are required." });
    }
    const user = await User.findById(req.user._id);
    user.bankDetails = {
      accountHolderName: accountHolderName.trim(),
      accountNumber: accountNumber.trim(),
      ifsc: ifsc.trim().toUpperCase(),
      bankName: bankName.trim(),
    };
    await user.save();
    await logAction(user, "Bank details updated", user._id);
    return res.json({ user: sanitize(user) });
  } catch (err) {
    return res.status(500).json({ message: "Could not save bank details.", error: err.message });
  }
}

function sanitize(user) {
  return {
    id: user._id,
    role: user.role,
    name: user.name,
    farmerId: user.farmerId || null,
    mobile: user.mobile || null,
    village: user.village || null,
    employeeId: user.employeeId || null,
    centre: user.centre || null,
    bankDetails: user.bankDetails || null,
    hasBankDetails: Boolean(user.bankDetails?.accountNumber),
  };
}

module.exports = {
  requestFarmerOtp,
  verifyFarmerOtp,
  staffRegister,
  staffLogin,
  me,
  saveBankDetails,
};