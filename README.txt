Nefertiti Nightclub Manager v2

Folders:
- backend: Node + Express + TypeScript + Zod + Jest + ESLint
- frontend: React + TypeScript + Vite + Tailwind + Firebase Auth

Basic setup:

1) Backend
   cd backend
   npm install
   npm run dev

   This starts the API on http://localhost:4000

2) Frontend
   cd frontend
   npm install
   npm run dev

   This starts the web app on http://localhost:5173 (proxying /api to backend).

3) Firebase
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
