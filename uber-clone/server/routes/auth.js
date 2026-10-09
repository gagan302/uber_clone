import { Router } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const r = Router();
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, vehicle: u.vehicle, online: u.online });

r.post("/register", async (req, res, next) => {
  try {
    const { name, email, password, role, vehicle } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: "All fields required" });
    if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered" });
    if (role === "captain" && !vehicle?.type) return res.status(400).json({ message: "Vehicle details required" });
    const user = await User.create({ name, email, password, role: role === "captain" ? "captain" : "rider", vehicle });
    res.status(201).json({ token: sign(user), user: pub(user) });
  } catch (e) { next(e); }
});
r.post("/login", async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).select("+password");
    if (!user || !(await user.matches(req.body.password))) return res.status(401).json({ message: "Invalid credentials" });
    res.json({ token: sign(user), user: pub(user) });
  } catch (e) { next(e); }
});
r.get("/me", protect(), (req, res) => res.json({ user: pub(req.user) }));
r.patch("/online", protect("captain"), async (req, res) => {
  req.user.online = !!req.body.online; await req.user.save();
  res.json({ online: req.user.online });
});
export default r;
