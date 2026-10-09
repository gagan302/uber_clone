import axios from "axios";
const G = "https://maps.googleapis.com/maps/api";
const key = () => process.env.GOOGLE_MAPS_API_KEY;
const bad = (m) => Object.assign(new Error(m), { status: 400 });

export const geocode = async (address) => {
  const { data } = await axios.get(`${G}/geocode/json`, { params: { address, key: key() } });
  if (data.status !== "OK") throw bad("Address not found: " + address);
  const r = data.results[0];
  return { address: r.formatted_address, ...r.geometry.location };
};
export const distanceTime = async (origin, destination) => {
  const { data } = await axios.get(`${G}/distancematrix/json`, { params: { origins: origin, destinations: destination, key: key() } });
  const el = data.rows?.[0]?.elements?.[0];
  if (!el || el.status !== "OK") throw bad("Route not found");
  return { distance: el.distance.value, duration: el.duration.value }; // metres, seconds
};
export const suggestions = async (input) => {
  const { data } = await axios.get(`${G}/place/autocomplete/json`, { params: { input, key: key() } });
  return (data.predictions || []).map((p) => p.description);
};
const RATES = { moto: { base: 20, km: 7, min: 1 }, auto: { base: 30, km: 10, min: 1.5 }, car: { base: 50, km: 15, min: 2 } };
export const calcFares = (distance, duration) =>
  Object.fromEntries(Object.entries(RATES).map(([t, r]) =>
    [t, Math.round(r.base + (distance / 1000) * r.km + (duration / 60) * r.min)]));
export const haversineKm = (a, b) => {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
