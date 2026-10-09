import { useEffect, useRef, useState } from "react";
import { api, errMsg } from "../api";
import { useAuth } from "../AuthContext";
import Header from "../components/Header";
import MapView from "../components/MapView";

export default function CaptainHome() {
  const { user, socket } = useAuth();
  const [online, setOnline] = useState(user.online);
  const [requests, setRequests] = useState([]);
  const [ride, setRide] = useState(null);
  const [otp, setOtp] = useState("");
  const [pos, setPos] = useState(null);
  const [msg, setMsg] = useState("");
  const watch = useRef(null);

  useEffect(() => { api.get("/rides/active").then((r) => r.data.ride && setRide(r.data.ride)); }, []);

  useEffect(() => {
    if (!socket) return;
    const onNew = (r) => setRequests((l) => [r, ...l.filter((x) => x._id !== r._id)]);
    const onCancel = ({ _id }) => { setRequests((l) => l.filter((x) => x._id !== _id)); setRide((r) => (r?._id === _id ? null : r)); };
    socket.on("new-ride", onNew); socket.on("ride-cancelled", onCancel);
    return () => { socket.off("new-ride", onNew); socket.off("ride-cancelled", onCancel); };
  }, [socket]);

  // stream live GPS to the server while online
  useEffect(() => {
    if (!online || !socket || !navigator.geolocation) return;
    watch.current = navigator.geolocation.watchPosition(
      ({ coords }) => { const p = { lat: coords.latitude, lng: coords.longitude }; setPos(p); socket.emit("update-location", p); },
      () => setMsg("Enable location access to receive rides"), { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(watch.current);
  }, [online, socket]);

  const toggle = async () => {
    const { data } = await api.patch("/auth/online", { online: !online });
    setOnline(data.online); if (!data.online) setRequests([]);
  };
  const act = async (path, body) => {
    setMsg("");
    try { const { data } = await api.patch(`/rides/${ride._id}/${path}`, body); setRide(data.ride); setOtp(""); return data.ride; }
    catch (e) { setMsg(errMsg(e)); }
  };
  const accept = async (r) => {
    try { const { data } = await api.patch(`/rides/${r._id}/accept`); setRide(data.ride); setRequests([]); }
    catch (e) { setMsg(errMsg(e)); setRequests((l) => l.filter((x) => x._id !== r._id)); }
  };

  const inTrip = ride && ["accepted", "ongoing"].includes(ride.status);
  const target = ride?.status === "ongoing" ? ride.destination : ride?.pickup;

  return (<>
    <Header>
      <button className={online ? "danger" : "primary"} onClick={toggle} disabled={!!inTrip}>
        {online ? "Go offline" : "Go online"}</button>
    </Header>
    <div className="layout">
      <aside className="card panel">
        <p className="muted">{user.vehicle?.model} · {user.vehicle?.plate} · {user.vehicle?.type}</p>
        {!online && !ride && <p>You are offline. Go online to receive ride requests.</p>}
        {online && !inTrip && requests.length === 0 && <p>Waiting for ride requests…</p>}

        {!inTrip && requests.map((r) => (
          <div className="req" key={r._id}>
            <b>{r.rider.name}</b> — ₹{r.fare}
            <p className="muted">{r.pickup.address}<br />→ {r.destination.address}<br />{(r.distance / 1000).toFixed(1)} km</p>
            <button className="primary" onClick={() => accept(r)}>Accept</button>
            <button className="link" onClick={() => setRequests((l) => l.filter((x) => x._id !== r._id))}>Ignore</button>
          </div>))}

        {ride?.status === "accepted" && <>
          <h3>Go to pickup</h3><p>{ride.pickup.address}</p>
          <input placeholder="Rider's 4-digit OTP" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value)} />
          <button className="primary" onClick={() => act("start", { otp })}>Start trip</button>
          <button className="danger" onClick={() => act("cancel")}>Cancel</button>
        </>}
        {ride?.status === "ongoing" && <>
          <h3>Drop off</h3><p>{ride.destination.address}</p><p>Fare: <b>₹{ride.fare}</b></p>
          <button className="primary" onClick={() => act("end")}>Complete trip</button>
        </>}
        {ride?.status === "completed" && <>
          <h3>Trip complete ✅</h3><p>Collect ₹{ride.fare}</p>
          <button className="primary" onClick={() => setRide(null)}>Done</button></>}
        {msg && <p className="err">{msg}</p>}
      </aside>
      <MapView me={pos} origin={inTrip && pos ? pos : null} destination={inTrip ? (target.address || target) : null} />
    </div>
  </>);
}
