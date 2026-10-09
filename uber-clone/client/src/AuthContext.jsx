import { createContext, useContext, useEffect, useState } from "react";
import { api, connectSocket } from "./api";

const Ctx = createContext();
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(true);

  const start = (token, u) => {
    localStorage.setItem("token", token);
    setUser(u);
    setSocket((old) => { old?.disconnect(); return connectSocket(token); });
  };
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) return setLoading(false);
    api.get("/auth/me").then((r) => start(t, r.data.user))
      .catch(() => localStorage.removeItem("token")).finally(() => setLoading(false));
  }, []);

  const login = async (body) => { const { data } = await api.post("/auth/login", body); start(data.token, data.user); return data.user; };
  const register = async (body) => { const { data } = await api.post("/auth/register", body); start(data.token, data.user); return data.user; };
  const logout = () => { localStorage.removeItem("token"); socket?.disconnect(); setSocket(null); setUser(null); };

  return <Ctx.Provider value={{ user, socket, loading, login, register, logout }}>{children}</Ctx.Provider>;
}
