# STAZE — Emergency Stabilization AI

STAZE is a React + Express emergency assistance web app designed to give fast stabilization guidance, bystander coordination, CPR support, nearby hospital lookup, and a structured incident report. It is optimized for urgent local use on `localhost` and supports English, Hindi, and Bengali.

## What it does

- Accepts typed or spoken emergency descriptions.
- Generates triage guidance through Gemini when available.
- Falls back to built-in offline protocols when Gemini is unavailable.
- Guides users through step-by-step stabilization with timers.
- Runs a full-screen CPR mode with metronome, compression counter, rescue-breath pauses, and elapsed-time tracking.
- Assigns bystander roles based on people count.
- Finds nearby hospitals with OpenStreetMap Overpass data and displays them on a Leaflet map.
- Opens turn-by-turn directions through a public Google Maps directions URL.
- Tracks symptom check-ins and timeline events during an active session.
- Builds a doctor handoff / incident report from the session log.
- Supports a larger-text Panic Safe mode.

## Current stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- shadcn/ui + Radix primitives
- Framer Motion
- Leaflet + React Leaflet
- Web Speech API

### Backend

- Node.js
- Express
- Gemini API for triage, hospital ranking, and doctor report generation
- OpenStreetMap Overpass API for hospital lookup
- Nominatim for manual city geocoding

## Key implementation notes

- No Google Maps API key is required.
- Hospital search uses OpenStreetMap data.
- The only API key used by this project is `GEMINI_API_KEY`.
- Voice recognition works best in Chrome or Edge on `http://localhost`.
- If Gemini is missing or fails, STAZE still works with fallback emergency protocols.

## Project structure

```text
staze/
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── triage.js
│   │   ├── hospitals.js
│   │   └── report.js
│   └── services/
│       ├── gemini.js
│       ├── language.js
│       ├── maps.js
│       └── osm.js
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── translations.js
│   │   ├── hooks/
│   │   ├── components/
│   │   └── lib/api.js
└── README.md
```

Note: `backend/services/maps.js` is legacy leftover code and is not required by the current OpenStreetMap-based hospital flow.

## Prerequisites

- Node.js 18+  
  Node 20+ is recommended.
- npm
- A Gemini API key if you want AI-backed triage/report/hospital ranking

## Environment setup

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

Optional frontend env:

Create `frontend/.env` only if you need to override the backend URL.

```env
VITE_API_BASE_URL=http://localhost:3001
```

If `GEMINI_API_KEY` is omitted, the app still runs, but:

- `/api/triage` uses offline fallback protocols
- `/api/report` returns a structured plain-text fallback report
- `/api/hospitals` still finds hospitals, but ranking falls back to local heuristics

## Install and run

### Windows quick start

From `FirstAid-AI`:

```bat
fix.bat
test.bat
```

What these do:

- `fix.bat` installs backend and frontend dependencies and runs a frontend production build
- `test.bat` starts both dev servers in separate terminals

### Manual start

Backend:

```bash
cd staze/backend
npm install
npm run dev
```

Frontend:

```bash
cd staze/frontend
npm install
npm run dev -- --host localhost
```

## Local URLs

- Frontend: `http://localhost:5173`
- Backend root: `http://127.0.0.1:3001`
- Backend health: `http://127.0.0.1:3001/api/health`

Use `localhost` for the frontend if you want browser speech recognition to work reliably.

## API summary

### `POST /api/triage`

Request:

```json
{
  "emergency": "boy fell in front of me and got his legs torn up",
  "language": "en",
  "peopleCount": 3
}
```

Response shape:

```json
{
  "severity": "CRITICAL",
  "condition": "Severe leg trauma",
  "steps": [
    {
      "title": "Control major bleeding",
      "detail": "Press firmly over bleeding wounds with a clean cloth.",
      "duration_seconds": 120
    }
  ],
  "cprRequired": false,
  "roles": [
    {
      "person": 1,
      "role": "Caller",
      "instruction": "Call 102/108 immediately.",
      "icon": "📞"
    }
  ],
  "warning": "Control bleeding immediately...",
  "reportSummary": "High-risk lower-limb trauma..."
}
```

### `POST /api/hospitals`

Request:

```json
{
  "lat": 22.72,
  "lng": 88.48,
  "emergency": "chest pain",
  "language": "en"
}
```

Behavior:

- queries nearby hospitals from Overpass
- sorts by distance and emergency relevance
- optionally re-ranks with Gemini
- returns OSM-backed hospitals with coordinates for mapping and directions

### `POST /api/report`

Request:

```json
{
  "session": {}
}
```

Behavior:

- creates a doctor handoff report from the live session
- uses Gemini when available
- falls back to a structured plain-text report when Gemini is unavailable

## Frontend feature map

- `Header.jsx`: language toggle, app status, Panic Safe toggle, report access
- `EmergencyInput.jsx`: emergency text input, people count, voice trigger, submit
- `QuickChips.jsx`: preset emergency shortcuts
- `TriageResponse.jsx`: severity badge, active steps, timers, CPR entry point
- `StepTimer.jsx`: countdown ring, pause/restart/skip, completion handling
- `CPRMode.jsx`: metronome, compression counter, pause window, elapsed timer
- `HospitalMap.jsx`: Leaflet map, OSM hospital list, Google Maps direction links
- `SymptomTracker.jsx`: check-in timer, modal questions, timeline updates
- `IncidentReport.jsx`: share/copy doctor handoff report
- `VoiceMode.jsx`: voice command entry and speech rate control

## Voice support

STAZE uses browser speech recognition and speech synthesis.

Supported:

- Chrome
- Microsoft Edge

Requirements:

- open the app on `http://localhost:5173`
- allow microphone permission
- avoid private/incognito windows when debugging voice issues

Current command phrases:

- `next step`
- `repeat`
- `call ambulance`
- `start cpr`

Speech recognition language follows the selected UI language:

- English: `en-IN`
- Hindi: `hi-IN`
- Bengali: `bn-IN`

## Hospital search flow

1. The frontend requests live geolocation.
2. If location is denied, manual city input is geocoded with Nominatim.
3. The backend queries nearby hospitals with Overpass.
4. The frontend renders those hospitals on a Leaflet map.
5. Clicking `Get Directions` opens a public Google Maps directions URL.

Operational notes:

- Overpass is free, but it can rate-limit.
- The backend includes retries, caching, and graceful fallback to an empty list.
- If no hospitals are returned, the UI offers a generic “Search Hospitals Near Me” action.

## Offline and fallback behavior

The app stores a small emergency scenario cache in `localStorage`.

If the network is down:

- quick scenarios remain available
- fallback triage protocols still work
- hospital map and live hospital search may not work
- the UI shows an offline banner instead of blanking out

## Troubleshooting

### Voice input says speech recognition is unavailable

Check:

- you are on `http://localhost:5173`
- you are using Chrome or Edge
- microphone permission is allowed
- Windows microphone access is enabled

### Hospital lookup returns no results

Possible causes:

- Overpass rate limiting
- denied location permission with no manual city entered
- temporary network failure

What to do:

- wait a moment and retry
- enter a manual city
- use the fallback “Search Hospitals Near Me” action

### Triage feels too generic

Check:

- backend is running
- `backend/.env` contains a valid `GEMINI_API_KEY`
- the browser has been hard refreshed after recent fixes

Without Gemini, STAZE uses built-in scenario detection and offline protocols.

### Frontend is up but voice still does nothing

Make sure you are not opening the app via `127.0.0.1`. Use `localhost`.

## Development notes

- Frontend API base URL defaults to `http://localhost:3001`.
- Backend uses `node --watch server.js` in development.
- Frontend uses `react-leaflet@4.2.1` to stay compatible with React 18.

## Safety notice

STAZE is an emergency guidance tool, not a certified medical device. It should support urgent decision-making, not replace licensed clinical judgment or emergency services. In a real emergency, call local emergency responders immediately.
