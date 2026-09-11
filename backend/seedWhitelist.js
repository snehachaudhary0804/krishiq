require("dotenv").config();
const mongoose = require("mongoose");
const WhitelistedFarmer = require("./src/models/WhitelistedFarmer");

const mockGovData = [
  // 1. Your primary testing profile
  {
    farmerId: "UP-AGRI-2026-89412",
    name: "Tulsi Tyagi",
    mobile: "9045439280",
    village: "Shivpur",
  },
  // 2. Secondary test slot (replace with a teammate's number for demo testing)
  {
    farmerId: "UP-AGRI-2026-10492",
    name: "Ramesh Chandra",
    mobile: "9876543210",
    village: "Rampur",
  },
  {
    farmerId: "UP-AGRI-2026-33918",
    name: "Suresh Kumar Patel",
    mobile: "9810234567",
    village: "Kalyanpur",
  },
  {
    farmerId: "UP-AGRI-2026-44109",
    name: "Harish Verma",
    mobile: "9711823490",
    village: "Fatehpur",
  },
  {
    farmerId: "UP-AGRI-2026-55921",
    name: "Dharmendra Yadav",
    mobile: "9958342110",
    village: "Bikramganj",
  },
  {
    farmerId: "UP-AGRI-2026-67034",
    name: "Balwinder Singh",
    mobile: "9818901234",
    village: "Shahpur",
  },
  {
    farmerId: "UP-AGRI-2026-71285",
    name: "Maheshwar Sharma",
    mobile: "9910456782",
    village: "Daulatpur",
  },
  {
    farmerId: "UP-AGRI-2026-82910",
    name: "Rajendra Prasad",
    mobile: "9871122334",
    village: "Gopalganj",
  },
  {
    farmerId: "UP-AGRI-2026-90432",
    name: "Omkar Nath",
    mobile: "9717889900",
    village: "Bishunpur",
  },
  {
    farmerId: "UP-AGRI-2026-99341",
    name: "Anil Kumar Mishra",
    mobile: "9990112233",
    village: "Mohanpur",
  },
  {
     farmerId: "UP-AGRI-2026-99441",
    name: "Sneha Chaudhary",
    mobile: "7217451469",
    village: "Bulandshahr",
  },
  {
     farmerId: "UP-AGRI-2026-6705",
    name: "Tiya",
    mobile: "8976543097",
    village: "Shahjadpur",
  },
  {
     farmerId: "UP-AGRI-2026-8769",
    name: "Balram singh",
    mobile: "8609543287",
    village: "Mathura",
  },
  {
    farmerId: "UP-AGRI-2026-11824",
    name: "Vikramaditya Chauhan",
    mobile: "9837124590",
    village: "Sikandrabad",
  },
  {
    farmerId: "UP-AGRI-2026-22481",
    name: "Pooja Rani",
    mobile: "9458231074",
    village: "Pilkhuwa",
  },
  {
    farmerId: "UP-AGRI-2026-33719",
    name: "Satish Chand Gangwar",
    mobile: "9759882341",
    village: "Nawabganj",
  },
  {
    farmerId: "UP-AGRI-2026-44820",
    name: "Kavita Devi",
    mobile: "9839441208",
    village: "Babrala",
  },
  {
    farmerId: "UP-AGRI-2026-55193",
    name: "Gurpreet Singh Gill",
    mobile: "9760238914",
    village: "Puranpur",
  },
  {
    farmerId: "UP-AGRI-2026-66402",
    name: "Devendra Pal Lodhi",
    mobile: "9634551289",
    village: "Kasganj",
  },
  {
    farmerId: "UP-AGRI-2026-77831",
    name: "Munna Lal Kushwaha",
    mobile: "9412678901",
    village: "Mauranipur",
  },
  {
    farmerId: "UP-AGRI-2026-88245",
    name: "Rekha Rawat",
    mobile: "9838012376",
    village: "Bakshi Ka Talab",
  },
  {
    farmerId: "UP-AGRI-2026-91307",
    name: "Mohammad Irfan",
    mobile: "9897445612",
    village: "Behat",
  },
  {
    farmerId: "UP-AGRI-2026-95418",
    name: "Chandra Prakash Awasthi",
    mobile: "9935128743",
    village: "Bithoor",
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await WhitelistedFarmer.deleteMany({});
    await WhitelistedFarmer.insertMany(mockGovData);
    console.log("Mock Government Whitelist seeded with 10 records successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();