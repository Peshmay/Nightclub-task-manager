// src/pages/HomePage.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useApp } from '../AppContext';

const HomePage: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const {
    stations,
    tasks,
    selectStation,
    enterAdminMode,
    verifyPassword,
    workspaceId,
    setWorkspaceId,
  } = useApp();

  const nav = useNavigate();
  const [passwordModal, setPasswordModal] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!workspaceId) {
      nav('/workspace', { replace: true });
    }
  }, [workspaceId, nav]);

  const userEmail = auth.currentUser?.email?.trim().toLowerCase() ?? null;

  const visibleStations = useMemo(() => {
    if (!stations) return [];
    if (isAdmin) return stations;
    if (!userEmail) return stations;

    return stations.filter((station) => {
      const assignees = station.assignees ?? [];
      const lower = assignees.map((a) => a.toLowerCase());
      return lower.includes(userEmail);
    });
  }, [stations, isAdmin, userEmail]);

  const getStationProgress = (stationId: string) => {
    const stationTasks = tasks.filter((t) => t.stationId === stationId);
    const completed = stationTasks.filter((t) => t.completed).length;
    const total = stationTasks.length;
    return { completed, total, points: completed };
  };

  const handleStationClick = (id: string) => {
    selectStation(id);
    nav('/station');
  };

  const handleAdminClick = () => {
    if (!isAdmin) return;
    setPasswordModal(true);
  };

  const handleAdminSubmit = () => {
    if (verifyPassword(password)) {
      setPassword('');
      setPasswordModal(false);
      enterAdminMode();
      nav('/admin');
    } else {
      alert('Incorrect password');
      setPassword('');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setWorkspaceId(null);
    localStorage.removeItem('workspaceId');
    nav('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-bgDark via-black to-bgDark text-white">
      <div className="max-w-xl mx-auto px-6 pt-10 pb-20">
        <header className="mb-8 flex justify-between items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span className="text-neonPurple text-3xl"></span> Nightclub Manager
            </h1>
            <p className="text-slate-400 mt-2">
              {isAdmin
                ? 'Select a station or open the admin panel.'
                : 'Select your assigned station to see your tasks.'}
            </p>
            {userEmail && (
              <p className="text-xs text-slate-500 mt-1">
                Logged in as <span className="font-mono">{userEmail}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {isAdmin && (
              <button
                onClick={handleAdminClick}
                className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-600 text-xs"
              >
                Admin
              </button>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-600 text-xs hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="space-y-4">
          {visibleStations.length === 0 ? (
            <p className="text-sm text-slate-400">
              No stations have been assigned to your email yet. Please contact your manager.
            </p>
          ) : (
            visibleStations.map((station) => {
              const progress = getStationProgress(station.id);
              return (
                <button
                  key={station.id}
                  onClick={() => handleStationClick(station.id)}
                  className="w-full text-left rounded-2xl border border-slate-700/70 px-4 py-4 hover:border-neonPurple/60 transition relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${station.color}33, #020617 60%)`,
                  }}
                >
                  <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: station.color }}
                  />
                  <div className="pl-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-lg">{station.name}</span>
                      <span className="text-sm text-slate-300">
                        Points:{' '}
                        <span style={{ color: station.color }} className="font-semibold">
                          {progress.points}
                        </span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mb-2">
                      {progress.completed}/{progress.total} tasks completed
                    </div>
                    {progress.total > 0 && (
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(progress.completed / progress.total) * 100}%`,
                            backgroundColor: station.color,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Password modal */}
      {isAdmin && passwordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-cardDark border border-slate-700 rounded-2xl p-6 w-80">
            <h2 className="text-xl font-bold mb-4">Enter Admin Password</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminSubmit()}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg mb-4"
              placeholder="Password"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdminSubmit}
                className="flex-1 px-4 py-2 bg-neonPurple rounded-lg hover:bg-neonPurple/80"
              >
                Submit
              </button>
              <button
                onClick={() => {
                  setPasswordModal(false);
                  setPassword('');
                }}
                className="flex-1 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
