# Uber Clone (MERN + Socket.IO + Google Maps)

Rider and Captain modules with JWT auth, role-based access control, real-time ride flow, fare estimation and live route display.

## Setup
1. Prerequisites: Node 18+, MongoDB running locally (or Atlas URI).
2. Google Cloud: enable **Maps JavaScript API, Places API, Geocoding API, Distance Matrix API, Directions API**; create one API key.
3. Backend: `cd server && cp .env.example .env` (fill values) `&& npm install && npm run dev`
4. Frontend: `cd client && cp .env.example .env` (fill values) `&& npm install && npm run dev`
5. Open http://localhost:5173

## Try it
Open two browsers (one normal, one incognito). Register a **Captain** (choose vehicle type) and a **Rider**.
Captain: Go online (allow location). Rider: enter pickup/destination -> Get fare -> choose same vehicle type -> Book.
Captain accepts -> rider sees OTP -> captain enters OTP to start -> Complete trip.

## Structure
- `server/models` User, Ride (Mongoose)
- `server/middleware/auth.js` JWT + role guard
- `server/routes` auth, rides, maps (REST)
- `server/utils/maps.js` geocode, distance matrix, autocomplete, fare formula, haversine
- `server/utils/socket.js` authenticated Socket.IO, live captain location
- `client/src` React pages (Auth, RiderHome, CaptainHome), MapView, AuthContext

## API
POST /api/auth/register | login, GET /me, PATCH /online (captain)
POST /api/rides/fare, POST /api/rides, GET /rides/mine | /active
PATCH /api/rides/:id/accept | start | end | cancel
GET /api/maps/suggestions?q=

## Socket events
server->rider: ride-accepted, ride-started, ride-ended, ride-cancelled, captain-location
server->captain: new-ride, ride-cancelled
client->server: update-location

## Fare formula
fare = base + km*rate + minutes*rate (per vehicle: moto / auto / car), in INR. Edit RATES in `server/utils/maps.js`.
