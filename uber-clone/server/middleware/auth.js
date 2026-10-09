import jwt from "jsonwebtoken";
import User from "../models/User.js";

// protect() = any logged-in user, protect("captain") = role-restricted (RBAC)
export const protect = (...roles) => async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Not authenticated" });
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(id);
    if (!req.user) return res.status(401).json({ message: "User not found" });
    if (roles.length && !roles.includes(req.user.role))
      return res.status(403).json({ message: "Access denied for role " + req.user.role });
    next();
  } catch { res.status(401).json({ message: "Invalid or expired token" }); }
};
