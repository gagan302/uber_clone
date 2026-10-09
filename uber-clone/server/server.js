import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { initSocket } from "./utils/socket.js";
import authRoutes from "./routes/auth.js";
import rideRoutes from "./routes/rides.js";
import mapRoutes from "./routes/maps.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/maps", mapRoutes);
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.status || 500).json({ message: err.message || "Server error" });
});

const server = http.createServer(app);
initSocket(server);
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB connected");
  server.listen(process.env.PORT || 5000, () => console.log("Server running"));
});
