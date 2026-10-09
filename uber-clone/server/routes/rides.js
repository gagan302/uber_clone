import { Router } from "express";
import Ride from "../models/Ride.js";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";
import { geocode, distanceTime, calcFares, haversineKm } from "../utils/maps.js";
import { emitTo } from "../utils/socket.js";

const r = Router();
const otp = () => String(Math.floor(1000 + Math.random() * 9000));
const rideFor = (id) => Ride.findById(id).populate("rider", "name socketId").populate("captain", "name vehicle location socketId");

// Fare estimate for every vehicle type
r.post("/fare", protect("rider"), async (req, res, next) => {
  try {
    const { distance, duration } = await distanceTime(req.body.pickup, req.body.destination);
    res.json({ distance, duration, fares: calcFares(distance, duration) });
  } catch (e) { next(e); }
});

// Book a ride -> broadcast to nearby online captains (<=10 km) with matching vehicle
r.post("/", protect("rider"), async (req, res, next) => {
  try {
    const { pickup, destination, vehicleType } = req.body;
    const [p, d, dt] = await Promise.all([geocode(pickup), geocode(destination), distanceTime(pickup, destination)]);
    const fare = calcFares(dt.distance, dt.duration)[vehicleType];
    if (!fare) return res.status(400).json({ message: "Invalid vehicle type" });
    const ride = await Ride.create({ rider: req.user._id, pickup: p, destination: d, ...dt, fare, vehicleType, otp: otp() });
    const captains = await User.find({ role: "captain", online: true, "vehicle.type": vehicleType, socketId: { $ne: null } });
    const payload = { _id: ride._id, pickup: p, destination: d, fare, distance: dt.distance, duration: dt.duration, rider: { name: req.user.name } };
    captains.filter((c) => c.location?.lat && haversineKm(c.location, p) <= 10)
      .forEach((c) => emitTo(c.socketId, "new-ride", payload));
    res.status(201).json({ ride });
  } catch (e) { next(e); }
});

r.get("/mine", protect(), async (req, res) => {
  const q = req.user.role === "rider" ? { rider: req.user._id } : { captain: req.user._id };
  res.json(await Ride.find(q).sort("-createdAt").limit(20));
});

// Restore current trip after page refresh (OTP only revealed to the rider)
r.get("/active", protect(), async (req, res) => {
  const q = { status: { $in: ["pending", "accepted", "ongoing"] }, [req.user.role]: req.user._id };
  const ride = await Ride.findOne(q).select("+otp").populate("captain", "name vehicle location").populate("rider", "name");
  const obj = ride?.toObject();
  if (obj && req.user.role === "captain") delete obj.otp;
  res.json({ ride: obj || null });
});

r.patch("/:id/accept", protect("captain"), async (req, res, next) => {
  try {
    const ride = await Ride.findOneAndUpdate({ _id: req.params.id, status: "pending" },
      { status: "accepted", captain: req.user._id }, { new: true }).select("+otp");
    if (!ride) return res.status(409).json({ message: "Ride no longer available" });
    const full = (await rideFor(ride._id)).toObject();
    emitTo(full.rider.socketId, "ride-accepted", { ...full, otp: ride.otp });
    res.json({ ride: full });
  } catch (e) { next(e); }
});

r.patch("/:id/start", protect("captain"), async (req, res, next) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, captain: req.user._id, status: "accepted" }).select("+otp");
    if (!ride) return res.status(404).json({ message: "Ride not found" });
    if (ride.otp !== req.body.otp) return res.status(400).json({ message: "Wrong OTP" });
    ride.status = "ongoing"; await ride.save();
    const full = await rideFor(ride._id);
    emitTo(full.rider.socketId, "ride-started", full);
    res.json({ ride: full });
  } catch (e) { next(e); }
});

r.patch("/:id/end", protect("captain"), async (req, res, next) => {
  try {
    const ride = await Ride.findOneAndUpdate({ _id: req.params.id, captain: req.user._id, status: "ongoing" }, { status: "completed" }, { new: true });
    if (!ride) return res.status(404).json({ message: "Ongoing ride not found" });
    const full = await rideFor(ride._id);
    emitTo(full.rider.socketId, "ride-ended", full);
    res.json({ ride: full });
  } catch (e) { next(e); }
});

r.patch("/:id/cancel", protect(), async (req, res, next) => {
  try {
    const field = req.user.role === "rider" ? "rider" : "captain";
    const ride = await Ride.findOneAndUpdate({ _id: req.params.id, [field]: req.user._id, status: { $in: ["pending", "accepted"] } }, { status: "cancelled" }, { new: true });
    if (!ride) return res.status(404).json({ message: "Cannot cancel this ride" });
    const full = await rideFor(ride._id);
    emitTo(full.rider?.socketId, "ride-cancelled", { _id: ride._id });
    emitTo(full.captain?.socketId, "ride-cancelled", { _id: ride._id });
    res.json({ ride: full });
  } catch (e) { next(e); }
});
export default r;
