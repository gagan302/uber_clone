import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { errMsg } from "../api";

export default function Auth({ mode }) {
  const { login, register } = useAuth();
  const [f, setF] = useState({ name: "", email: "", password: "", role: "rider", plate: "", model: "", vtype: "car" });
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    try {
      if (mode === "login") await login({ email: f.email, password: f.password });
      else await register({ name: f.name, email: f.email, password: f.password, role: f.role,
        vehicle: f.role === "captain" ? { plate: f.plate, model: f.model, type: f.vtype } : undefined });
    } catch (e) { setErr(errMsg(e)); }
  };
  return (
    <form className="card auth" onSubmit={submit}>
      <h2>{mode === "login" ? "Welcome back" : "Create account"}</h2>
      {mode === "register" && <>
        <div className="tabs">
          {["rider", "captain"].map((r) => (
            <button type="button" key={r} className={f.role === r ? "on" : ""} onClick={() => setF({ ...f, role: r })}>
              {r === "rider" ? "Rider" : "Captain"}</button>))}
        </div>
        <input placeholder="Full name" value={f.name} onChange={set("name")} required />
      </>}
      <input type="email" placeholder="Email" value={f.email} onChange={set("email")} required />
      <input type="password" placeholder="Password (min 6)" minLength={6} value={f.password} onChange={set("password")} required />
      {mode === "register" && f.role === "captain" && <>
        <input placeholder="Vehicle plate" value={f.plate} onChange={set("plate")} required />
        <input placeholder="Vehicle model" value={f.model} onChange={set("model")} required />
        <select value={f.vtype} onChange={set("vtype")}>
          <option value="moto">Moto</option><option value="auto">Auto</option><option value="car">Car</option>
        </select>
      </>}
      {err && <p className="err">{err}</p>}
      <button className="primary">{mode === "login" ? "Login" : "Sign up"}</button>
      <p>{mode === "login" ? <Link to="/register">New here? Register</Link> : <Link to="/login">Have an account? Login</Link>}</p>
    </form>
  );
}
