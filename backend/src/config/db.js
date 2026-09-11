const mongoose = require("mongoose");

/**
 * If MONGO_URI is set in .env, we connect to that (a real local MongoDB or an Atlas cluster) -
 * data persists normally.
 *
 * If it is NOT set, we spin up an in-memory MongoDB automatically (via mongodb-memory-server)
 * so the whole project runs with zero setup - no MongoDB install, no Atlas account. This is
 * meant for quickly running/demoing the project. Data is lost when the server restarts, so for
 * anything beyond a demo, set MONGO_URI to a real database in .env.
 */
async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (uri) {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
    return;
  }

  console.log("No MONGO_URI set - starting an in-memory MongoDB for this session (demo mode).");
  console.log("Data will reset when the server stops. Set MONGO_URI in .env for persistent storage.");

  try {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    // Pinned to a specific, well-mirrored version to reduce the chance of a platform/version
    // combination that isn't hosted (the library's "auto-pick latest" can occasionally 404).
    const mem = await MongoMemoryServer.create({ binary: { version: "6.0.9" } });
    const memUri = mem.getUri("krishiqueue");
    await mongoose.connect(memUri);
    console.log("In-memory MongoDB ready.");
  } catch (err) {
    console.error("\nCould not start the built-in in-memory MongoDB.");
    console.error("This step needs internet access once, to download a small MongoDB binary.");
    console.error("Fix: connect to the internet and retry, or set MONGO_URI in backend/.env to a");
    console.error("real MongoDB (local install or a free MongoDB Atlas cluster). See README.md section 2.\n");
    process.exit(1);
  }
}

module.exports = connectDB;
