import mongoose from "mongoose";
const place = { address: String, lat: Number, lng: Number };
const rideSchema = new mongoose.Schema({
  rider: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  captain: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  pickup: place, destination: place,
  distance: Number, duration: Number, fare: Number,
  vehicleType: { type: String, enum: ["auto", "car", "moto"], required: true },
  status: { type: String, enum: ["pending", "accepted", "ongoing", "completed", "cancelled"], default: "pending" },
  otp: { type: String, select: false },
}, { timestamps: true });
export default mongoose.model("Ride", rideSchema);
