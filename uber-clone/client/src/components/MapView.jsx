import { useEffect, useState } from "react";
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from "@react-google-maps/api";

const DEFAULT = { lat: 26.9124, lng: 75.7873 }; // Jaipur

// origin/destination: address strings or {lat,lng}; captain: {lat,lng}
export default function MapView({ origin, destination, captain, me }) {
  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY });
  const [dir, setDir] = useState(null);

  useEffect(() => {
    if (!isLoaded || !origin || !destination) return setDir(null);
    new window.google.maps.DirectionsService().route(
      { origin, destination, travelMode: "DRIVING" },
      (res, status) => setDir(status === "OK" ? res : null)
    );
  }, [isLoaded, origin, destination]);

  if (!isLoaded) return <div className="map center">Loading map…</div>;
  return (
    <GoogleMap mapContainerClassName="map" center={captain || me || DEFAULT} zoom={14}
      options={{ disableDefaultUI: true, zoomControl: true }}>
      {dir && <DirectionsRenderer directions={dir} />}
      {captain && <Marker position={captain} label="🚗" />}
      {me && !dir && <Marker position={me} />}
    </GoogleMap>
  );
}
