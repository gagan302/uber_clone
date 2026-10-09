import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Ride from "../models/Ride.js";

let io;
export const emitTo = (socketId, event, data) => { if (io && socketId) io.to(socketId).emit(event, data); };

export const initSocket = (server) => {
  io = new Server(server, { cors: { origin: process.env.CLIENT_URL } });
  io.use((socket, next) => {
    try { socket.userId = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET).id; next(); }
    catch { next(new Error("Unauthorized")); }
  });
  io.on("connection", async (socket) => {
    await User.findByIdAndUpdate(socket.userId, { socketId: socket.id });
    socket.on("update-location", async ({ lat, lng }) => {
      await User.findByIdAndUpdate(socket.userId, { location: { lat, lng } });
      const ride = await Ride.findOne({ captain: socket.userId, status: { $in: ["accepted", "ongoing"] } }).populate("rider");
      if (ride?.rider?.socketId) emitTo(ride.rider.socketId, "captain-location", { lat, lng });
    });
    socket.on("disconnect", async () => {
      await User.updateOne({ _id: socket.userId, socketId: socket.id }, { socketId: null });
    });
  });
};
