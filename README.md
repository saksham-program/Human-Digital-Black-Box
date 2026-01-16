# Echo Trace – Human Black Box (Demo)

Echo Trace is an educational prototype (“Human Black Box”) that demonstrates a personal safety monitoring dashboard. It simulates health vitals, location tracking, an SOS emergency workflow, and basic user settings using a lightweight Node.js + Express backend and a Vanilla JS frontend.

## Features

- Demo Authentication (Signup/Login) backed by a local JSON file
- Live Dashboard with realistic mock health stats (heart rate, SpO₂, stress, sleep)
- Activity Timeline with filter modes (24 hours / 7 days)
- Health Monitor charts using Chart.js
- SOS System: triggers an emergency event + logs to timeline + UI notification
- Location Tracking simulation + downloadable “Location Report”
- Settings Management:
  - Trusted Contacts CRUD (Create/Read/Update/Delete)
  - Privacy Toggles (persisted per user)

## Tech Stack

- Frontend: HTML5, CSS3, Vanilla JavaScript (ES6+)
- Backend: Node.js + Express
- Storage: Local JSON files (`backend/data/*.json`)
- Charts: Chart.js (CDN)

## Installation & Run

### 1) Start the backend

```bash
cd backend
npm install
npm start
```

Backend will run at: `http://localhost:3001`

### 2) Open the frontend

Open `frontend/index.html` with any static server (recommended):

- VS Code: **Live Server** extension
- Or any local server of your choice

> The frontend calls the backend API at `http://localhost:3001`.

## Disclaimer

This project is a **demo / educational prototype**. It stores passwords in plain text and uses an in-memory session token store. Do **not** use this as-is for production.
