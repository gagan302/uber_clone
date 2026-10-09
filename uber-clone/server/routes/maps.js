import { Router } from "express";
import { protect } from "../middleware/auth.js";
import { suggestions } from "../utils/maps.js";
const r = Router();
r.get("/suggestions", protect(), async (req, res, next) => {
  try { res.json(req.query.q?.length > 2 ? await suggestions(req.query.q) : []); } catch (e) { next(e); }
});
export default r;
