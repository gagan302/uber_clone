import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import Auth from "./pages/Auth";
import RiderHome from "./pages/RiderHome";
import CaptainHome from "./pages/CaptainHome";

function Guard({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="center">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === "captain" ? "/captain" : "/rider"} replace />;
  return children;
}
export default function App() {
  const { user } = useAuth();
  const home = user ? (user.role === "captain" ? "/captain" : "/rider") : "/login";
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={home} /> : <Auth mode="login" />} />
      <Route path="/register" element={user ? <Navigate to={home} /> : <Auth mode="register" />} />
      <Route path="/rider" element={<Guard role="rider"><RiderHome /></Guard>} />
      <Route path="/captain" element={<Guard role="captain"><CaptainHome /></Guard>} />
      <Route path="*" element={<Navigate to={home} />} />
    </Routes>
  );
}
