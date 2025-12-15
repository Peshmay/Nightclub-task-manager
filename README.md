# Nefertiti-task-app

# Nefertiti Task App

A simple task + message system for a nightclub team.

- **Admin (manager)** creates stations and tasks
- **Staff** sees only assigned stations (by email)
- **Real-time style polling** (frontend refreshes every few seconds)
- **Message board**: Admin ↔ Staff communication
- **Admin PIN** stored per workspace (default: `1111`)

---

## Project Structure

Nefertiti-task-app/
backend/ # Express + TypeScript REST API
frontend/ # React + Vite + TypeScript UI

## Features

### Workspaces

- Create multiple workspaces (e.g. different clubs or locations)
- Workspace selection is stored in `localStorage` (`workspaceId`)

### Stations

- Station name + color
- Optional staff assignment using emails (e.g. `bar1@nefertiti.com`)
- Staff will only see stations assigned to their email
  - If no stations are assigned for that email, staff sees all stations (fallback)

### Tasks

- Tasks belong to a station
- Categories:
  - Before Opening
  - Open Hours
  - Closing
- Staff can mark tasks complete
- Admin can clear all tasks (reset all completed tasks)

### Messages

- Admin can broadcast to all stations or send to a specific station
- Staff can reply to admin
- Admin can clear messages per workspace

## Tech Stack

**Frontend**

- React + TypeScript
- Vite
- Tailwind (utility styling)
- Firebase Auth (login)

**Backend**

- Express + TypeScript
- Zod validation
- In-memory database (for now)

## Local Development

1. Backend
   cd backend
   npm install
   npm run dev

   This starts the API on http://localhost:4000

2. Frontend
   cd frontend
   npm install
   npm run dev

   This starts the web app on http://localhost:5173 (proxying /api to backend).

3. Firebase
   Create frontend/.env with:

   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...

   These come from your Firebase project.

Login uses Firebase email/password and Google sign-in.
After login, you select a workspace, then you see the station selector and admin panel like in your mobile design, with a dark neon theme.
