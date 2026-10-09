import { useEffect, useState } from "react";
import { api, errMsg } from "../api";
import { useAuth } from "../AuthContext";
import Header from "../components/Header";
import MapView from "../components/MapView";

const ICON = { moto: "🏍️", auto: "🛺", car: "🚗" };
const km = (m) => (m / 1000).toFixed(1) + " km";
const mins = (s) => Math.round(s / 60) + " min";

function PlaceInput({ value, onChange, placeholder, id }) {
  const [opts, setOpts] = useState([]);
  useEffect(() => {
    const t = setTimeout(() => {
      if (value.length > 2) api.get("/maps/suggestions", { params: { q: value } }).then((r) => setOpts(r.data)).catch(() => {});
    }, 350);
    return () => clearTimeout(t);
  }, [value]);
  return (<>
    <input list={id} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} />
    <datalist id={id}>{opts.map((o) => <option key={o} value={o} />)}</datalist>
  </>);
}

export default function RiderHome() {
  const { socket } = useAuth();
  const [pickup, setPickup] = useState("");
  const [dest, setDest] = useState("");
  const [quote, setQuote] = useState(null);
  const [type, setType] = useState("car");
  const [ride, setRide] = useState(null);
  const [captainPos, setCaptainPos] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api.get("/rides/active").then((r) => r.data.ride && setRide(r.data.ride));
  }, []);
  useEffect(() => {
    if (!socket) return;
    const on = {
      "ride-accepted": setRide,
      "ride-started": (r) => setRide((o) => ({ ...o, ...r })),
      "ride-ended": (r) => { setRide(r); setCaptainPos(null); },
      "ride-cancelled": () => { setRide(null); setCaptainPos(null); setMsg("Ride was cancelled"); },
      "captain-location": setCaptainPos,
    };
    Object.entries(on).forEach(([e, h]) => socket.on(e, h));
    return () => Object.keys(on).forEach((e) => socket.off(e));
  }, [socket]);

  const getFare = async () => {
    setMsg("");
    try { setQuote((await api.post("/rides/fare", { pickup, destination: dest })).data); }
    catch (e) { setMsg(errMsg(e)); }
  };
  const book = async () => {
    try { setRide((await api.post("/rides", { pickup, destination: dest, vehicleType: type })).data.ride); setQuote(null); }
    catch (e) { setMsg(errMsg(e)); }
  };
  const cancel = async () => { try { await api.patch(`/rides/${ride._id}/cancel`); setRide(null); } catch (e) { setMsg(errMsg(e)); } };
  const reset = () => { setRide(null); setPickup(""); setDest(""); setQuote(null); setMsg(""); };

  const active = ride && ["pending", "accepted", "ongoing"].includes(ride.status);
  const o = ride?.pickup?.address || (quote && pickup);
  const d = ride?.destination?.address || (quote && dest);

  return (<>
    <Header />
    <div className="layout">
      <aside className="card panel">
        {!ride && <>
          <h3>Where to?</h3>
          <PlaceInput id="p" value={pickup} onChange={setPickup} placeholder="Pickup location" />
          <PlaceInput id="d" value={dest} onChange={setDest} placeholder="Destination" />
          <button className="primary" disabled={!pickup || !dest} onClick={getFare}>Get fare</button>
          {quote && <>
            <p className="muted">{km(quote.distance)} · {mins(quote.duration)}</p>
            {Object.entries(quote.fares).map(([t, f]) => (
              <div key={t} className={"opt " + (type === t ? "on" : "")} onClick={() => setType(t)}>
                <span>{ICON[t]} {t.toUpperCase()}</span><b>₹{f}</b>
              </div>))}
            <button className="primary" onClick={book}>Book {type}</button>
          </>}
        </>}

        {ride?.status === "pending" && <><h3>Finding a captain…</h3><p className="muted">Nearby captains have been notified.</p>
          <button className="danger" onClick={cancel}>Cancel</button></>}

        {ride && ["accepted", "ongoing"].includes(ride.status) && <>
          <h3>{ride.status === "accepted" ? "Captain on the way" : "Trip in progress"}</h3>
          <p><b>{ride.captain?.name}</b> · {ride.captain?.vehicle?.model} · {ride.captain?.vehicle?.plate}</p>
          {ride.status === "accepted" && ride.otp && <div className="otp">OTP: {ride.otp}</div>}
          <p className="muted">To: {ride.destination.address}</p>
          <p>Fare: <b>₹{ride.fare}</b></p>
          {ride.status === "accepted" && <button className="danger" onClick={cancel}>Cancel</button>}
        </>}

        {ride?.status === "completed" && <><h3>Trip completed 🎉</h3><p>Pay ₹{ride.fare} to your captain.</p>
          <button className="primary" onClick={reset}>Book another</button></>}
        {msg && <p className="err">{msg}</p>}
      </aside>
      <MapView origin={o} destination={d} captain={active ? captainPos : null} />
    </div>
  </>);
}
