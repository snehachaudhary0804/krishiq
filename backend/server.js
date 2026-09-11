require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");

const express = require("express");
const http = require("http");

// Turn an unhandled crash (e.g. in-memory MongoDB download failing offline) into a clear,
// friendly message instead of a raw stack trace, so a first-time run stays easy to debug.
process.on("unhandledRejection", (err) => {
  console.error("\nServer failed to start:", err?.message || err);
  console.error("If this happened while starting the in-memory MongoDB, see backend/.env.example");
  console.error("and set MONGO_URI to a real MongoDB (local or MongoDB Atlas) instead.\n");
  process.exit(1);
});
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./src/config/db");
const { initSocket } = require("./src/utils/socket");

const authRoutes = require("./src/routes/authRoutes");
const centreRoutes = require("./src/routes/centreRoutes");
const cropRoutes = require("./src/routes/cropRoutes");
const bookingRoutes = require("./src/routes/bookingRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const auditRoutes = require("./src/routes/auditRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const payoutRoutes = require("./src/routes/payoutRoutes");

const app = express();
const httpServer = http.createServer(app);
initSocket(httpServer);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "KrishiQueue API" }));

app.use("/api/auth", authRoutes);
app.use("/api/centres", centreRoutes);
app.use("/api/crops", cropRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/payouts", payoutRoutes);

// 404 handler
app.use((req, res) => res.status(404).json({ message: "Route not found." }));

// centralized error handler
app.use((err, req, res, next) => {
 console.error(err);
 res.status(500).json({ message: "Internal server error.", error: err.message });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
 httpServer.listen(PORT, () => console.log(`KrishiQueue API running on http://localhost:${PORT}`));
});
