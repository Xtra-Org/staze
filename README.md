# STAZE — Emergency Stabilization AI

STAZE is a hackathon-ready emergency response web app that helps bystanders act correctly in the critical minutes before professional medical help arrives. It provides AI-assisted triage, step-by-step stabilization guidance, CPR support, symptom re-checks, nearby hospital discovery, and a structured incident report.

## Problem it solves

In real emergencies, the first few minutes matter most, but the people present are usually not trained responders. They panic, search the internet, get generic advice, or waste time deciding what to do first. This gap between the incident and professional medical care can worsen outcomes in burns, bleeding, trauma, choking, seizures, cardiac events, drowning, and unconscious-collapse cases.

Existing solutions are fragmented:

- emergency numbers help call responders, but do not guide immediate action
- search engines return long articles instead of condition-specific instructions
- most tools are not built for panic conditions, multilingual users, or voice-first use
- bystanders are not coordinated, symptom progression is not tracked, and medical handoff is usually poor

STAZE solves this by turning a typed or spoken emergency description into fast, condition-aware stabilization guidance. It helps ordinary people do the right thing before the ambulance arrives instead of doing nothing or doing the wrong thing.

## Hackathon framing

STAZE sits at the intersection of healthcare, AI, accessibility, and public safety.

Why it matters:

- reduces delay in first response
- converts panic into structured action
- supports non-medical users with clear next steps
- works in English, Hindi, and Bengali
- remains useful even when AI or connectivity is degraded through fallback protocols
- improves downstream care through a generated incident report

## Core capabilities

- AI-assisted emergency triage
- condition-specific first-response steps
- full-screen CPR mode with metronome and cycle tracking
- bystander role assignment
- symptom check-ins that adapt to the active condition
- nearby hospital search using OpenStreetMap + Leaflet
- public Google Maps directions redirect
- voice input and spoken step guidance
- local session persistence and offline fallback scenarios
- doctor handoff / incident report generation

## Demo Video
- https://drive.google.com/file/d/1JdQBqKalNzffwlDi1Z5r8UEjrk9P7okw/view?usp=sharing

## Tech stack

### Frontend

- React 18
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI primitives
- Framer Motion
- Leaflet + React Leaflet
- Web Speech API

### Backend

- Node.js
- Express
- Gemini API
- OpenStreetMap Overpass API
- Nominatim geocoding

## Repository structure

```text
FirstAid-AI/
├── fix.bat
├── test.bat
├── README.md
└── staze/
    ├── backend/
    │   ├── server.js
    │   ├── routes/
    │   └── services/
    └── frontend/
        ├── package.json
        └── src/
```

## Environment setup

Create `staze/backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

Optional frontend override in `staze/frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Notes:

- no Google Maps API key is required
- the only API key used is `GEMINI_API_KEY`
- if Gemini is unavailable, STAZE still works with fallback protocols and heuristic hospital ranking

## Run locally

### Windows quick start

From the repo root:

```bat
fix.bat
test.bat
```

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
- Backend: `http://127.0.0.1:3001`
- Health check: `http://127.0.0.1:3001/api/health`

Use `localhost` for the frontend if you want browser speech recognition to work reliably.

## API overview

### `POST /api/triage`

Accepts:

```json
{
  "emergency": "A boy fell in front of me and got his legs injured",
  "language": "en",
  "peopleCount": 2
}
```

Returns:

- severity
- detected condition
- stable `scenario`
- steps
- CPR requirement
- bystander roles
- warning
- report summary

### `POST /api/hospitals`

Accepts coordinates and emergency text, then:

- finds nearby hospitals via Overpass
- ranks them with heuristics and Gemini when available
- returns hospital coordinates for Leaflet rendering and directions

### `POST /api/report`

Builds a doctor handoff report from the current session.

## Voice and accessibility

- speech recognition works best in Chrome or Edge
- frontend should be opened on `http://localhost:5173`
- UI language and voice language stay aligned
- Panic Safe mode increases readability and strips decorative overload

## Offline behavior

STAZE stores fallback emergency scenarios in `localStorage`. If AI or network access fails, the app still provides usable stabilization guidance instead of blanking out.

## Safety note

STAZE is an emergency guidance assistant, not a replacement for professional medical care. In a real emergency, call local emergency services immediately.
