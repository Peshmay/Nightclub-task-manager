// src/App.tsx
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";

import Login from "./pages/Login";
import WorkspacePage from "./pages/WorkspacePage";
import HomePage from "./pages/HomePage";       // staff: choose station
import StationPage from "./pages/StationPage"; // staff: station tasks
import AdminPage from "./pages/AdminPage";     // admin panel

import { AppProvider, useApp } from "./AppContext";

const AppShell: React.FC = () => {
  const { workspaceId } = useApp();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  // who is admin?
  const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || "")
    .split(",")
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  const isAdminUser =
    !!(user?.email && adminEmails.includes(user.email.toLowerCase()));

  // Still checking auth
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-black to-slate-950 text-white">
        <p className="text-lg">Checking login…</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Root – decide where to go after login */}
        <Route
          path="/"
          element={
            user ? (
              // already logged in
              isAdminUser ? (
                // admin
                workspaceId ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/workspace" replace />
                )
              ) : // staff
              workspaceId ? (
                <Navigate to="/zone" replace />
              ) : (
                <Navigate to="/workspace" replace />
              )
            ) : (
              // NOT logged in -> show Login
              <Login />
            )
          }
        />

        {/* Workspace selection (both admin & staff use this once) */}
        <Route
          path="/workspace"
          element={
            user ? (
              <WorkspacePage isAdmin={isAdminUser} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Staff: choose station */}
        <Route
          path="/zone"
          element={
            user ? (
              workspaceId ? (
                <HomePage isAdmin={isAdminUser} />
              ) : (
                <Navigate to="/workspace" replace />
              )
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Staff: station tasks */}
        <Route
          path="/station"
          element={
            user ? (
              workspaceId ? (
                <StationPage />
              ) : (
                <Navigate to="/workspace" replace />
              )
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Admin panel – only admins allowed */}
        <Route
          path="/admin"
          element={
            user ? (
              isAdminUser ? (
                workspaceId ? (
                  <AdminPage />
                ) : (
                  <Navigate to="/workspace" replace />
                )
              ) : (
                // staff trying to open /admin → send to /zone
                <Navigate to="/zone" replace />
              )
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
};

export default App;
