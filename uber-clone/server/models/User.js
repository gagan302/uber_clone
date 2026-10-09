import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ["rider", "captain"], default: "rider" },
  vehicle: { plate: String, model: String, type: { type: String, enum: ["auto", "car", "moto"] } },
  online: { type: Boolean, default: false },
  socketId: String,
  location: { lat: Number, lng: Number },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.matches = function (pw) { return bcrypt.compare(pw, this.password); };
export default mongoose.model("User", userSchema);
