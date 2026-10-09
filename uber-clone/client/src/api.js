import axios from "axios";
import { io } from "socket.io-client";
export const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const api = axios.create({ baseURL: API + "/api" });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
export const errMsg = (e) => e.response?.data?.message || e.message;
export const connectSocket = (token) => io(API, { auth: { token } });
