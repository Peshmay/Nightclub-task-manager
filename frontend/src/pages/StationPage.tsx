// frontend/src/pages/StationPage.tsx
import React, { useMemo, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

import { useApp } from "../AppContext";
import { auth } from "../firebase";
import type { Task } from "../types";

type TaskCategory = "before-opening" | "open-hours" | "closing";

const categoryLabel: Record<TaskCategory, string> = {
  "before-opening": "Before Opening",
  "open-hours": "Open Hours",
  closing: "Closing",
};

const StationPage: React.FC = () => {
  const {
    stations,
    tasks,
    messages,
    selectedStationId,
    selectStation,
    toggleTask,
    sendMessage,
    enterAdminMode,
    setWorkspaceId,
  } = useApp();

  const nav = useNavigate();
  const [messageText, setMessageText] = useState("");

  const userEmail =
    auth.currentUser?.email?.trim().toLowerCase() ?? "staff@nefertiti.com";

  // --- derived data with hooks ALWAYS called unconditionally ---

  const assignedStations = useMemo(() => {
    const email = userEmail.toLowerCase();
    const filtered = stations.filter((s) =>
      (s.assignees ?? []).some((a) => a.toLowerCase() === email)
    );
    return filtered.length > 0 ? filtered : stations;
  }, [stations, userEmail]);

  const activeStation = useMemo(() => {
    if (!selectedStationId) {
      return assignedStations[0] ?? null;
    }
    return assignedStations.find((s) => s.id === selectedStationId) ?? null;
  }, [assignedStations, selectedStationId]);

  const stationTasks = useMemo(() => {
    if (!activeStation) return [] as Task[];
    return tasks.filter((t) => t.stationId === activeStation.id);
  }, [tasks, activeStation]);

  const groupedTasks = useMemo(() => {
    const groups: Record<TaskCategory, Task[]> = {
      "before-opening": [],
      "open-hours": [],
      closing: [],
    };

    for (const t of stationTasks) {
      groups[t.category as TaskCategory]?.push(t);
    }

    return groups;
  }, [stationTasks]);

  const stationMessages = useMemo(
    () =>
      messages.filter(
        (m) =>
          // Messages targeted at this station OR broadcast (stationId === null)
          (!activeStation && m.stationId === null) ||
          (activeStation && (m.stationId === null || m.stationId === activeStation.id))
      ),
    [messages, activeStation]
  );

  // --- handlers ---

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setWorkspaceId(null);
    nav("/", { replace: true });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = messageText.trim();
    if (!text) return;

    const stationId = activeStation ? activeStation.id : null;
    await sendMessage(text, stationId, false);
    setMessageText("");
  };

  const handleSelectStationClick = (id: string) => {
    selectStation(id);
  };

  const isAdminUser = userEmail === "manager@nefertiti.com";

  // --- render ---

  if (!activeStation) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#050510] via-[#11091f] to-[#050510] text-white">
        <p className="mb-4 text-sm text-slate-300">
          No stations assigned yet. Ask admin to assign your email to a station.
        </p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-xs rounded-lg bg-slate-800 border border-slate-600 hover:bg-slate-700"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050510] via-[#11091f] to-[#050510] text-white">
      {/* HEADER */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: activeStation.color }}
          />
          <div>
            <h1 className="text-lg font-semibold">{activeStation.name}</h1>
            <p className="text-[11px] text-slate-400">
              Logged in as <span className="font-mono">{userEmail}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdminUser && (
            <button
              onClick={enterAdminMode}
              className="px-3 py-1 rounded-lg bg-cyan-700/80 border border-cyan-500/60 text-xs hover:bg-cyan-800/60 font-semibold"
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid gap-6 md:grid-cols-[220px,2fr,1.4fr]">
        {/* LEFT: station list */}
        <aside className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Stations
          </h2>
          <div className="space-y-2">
            {assignedStations.map((station) => (
              <button
                key={station.id}
                onClick={() => handleSelectStationClick(station.id)}
                className={`w-full text-left px-3 py-2 rounded-xl border text-xs ${
                  activeStation.id === station.id
                    ? "bg-white/10 border-white/30"
                    : "bg-black/20 border-white/5 hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: station.color }}
                  />
                  <span className="font-medium">{station.name}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* MIDDLE: tasks */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-100">
            Tasks for today
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {(Object.keys(groupedTasks) as TaskCategory[]).map((cat) => {
              const list = groupedTasks[cat];
              if (!list.length) return null;

              return (
                <div
                  key={cat}
                  className="bg-black/30 border border-white/10 rounded-2xl p-3 space-y-2"
                >
                  <h3 className="text-[11px] font-semibold uppercase tracking-wide text-purple-300">
                    {categoryLabel[cat]}
                  </h3>
                  <div className="space-y-1.5">
                    {list.map((task) => (
                      <label
                        key={task.id}
                        className="flex items-center gap-2 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="w-3.5 h-3.5 rounded border-slate-500 bg-slate-900 text-purple-500"
                        />
                        <span
                          className={
                            task.completed
                              ? "line-through text-slate-500"
                              : "text-slate-100"
                          }
                        >
                          {task.title}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT: messages */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-100">
            Messages
          </h2>

          <div className="h-64 md:h-72 bg-black/30 border border-white/10 rounded-2xl p-3 overflow-y-auto space-y-2 flex flex-col-reverse">
            {stationMessages.length === 0 ? (
              <p className="text-xs text-slate-500 text-center mt-6">
                No messages yet. Admin messages and staff replies will show here.
              </p>
            ) : (
              stationMessages.map((msg) => {
                const isAdmin = msg.fromSupervisor;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isAdmin ? "justify-start" : "justify-end"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-xl text-xs shadow-md ${
                        isAdmin
                          ? "bg-cyan-600/80 text-white rounded-tl-none"
                          : "bg-slate-700/80 text-slate-200 rounded-br-none"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[9px] font-bold ${
                            isAdmin ? "text-cyan-200" : "text-purple-200"
                          }`}
                        >
                          {isAdmin ? "ADMIN" : "YOU"}
                        </span>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form onSubmit={handleSendMessage} className="space-y-2">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Reply to admin or send a note..."
              className="w-full bg-black/40 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[70px]"
            />
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send message
            </button>
          </form>
        </section>
      </main>
    </div>
  );
};

export default StationPage;
