// frontend/src/pages/StationPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import { useApp } from "../AppContext";
import { auth } from "../firebase";

const StationPage: React.FC = () => {
  const {
    stations,
    tasks,
    messages,
    selectedStationId,
    toggleTask,
    sendMessage,
    getScoreboard,
    exitToHome,
    setWorkspaceId,
  } = useApp();

  const nav = useNavigate();
  const [messageText, setMessageText] = useState("");
  const [showChat, setShowChat] = useState(false);

  const station = stations.find((s) => s.id === selectedStationId);

  if (!station) {
    nav("/zone");
    return null;
  }

  const stationTasks = tasks.filter((t) => t.stationId === station.id);
  const beforeOpening = stationTasks.filter(
    (t) => t.category === "before-opening"
  );
  const openHours = stationTasks.filter((t) => t.category === "open-hours");
  const closing = stationTasks.filter((t) => t.category === "closing");
  const scoreboard = getScoreboard();

  const stationMessages = useMemo(
    () =>
      messages
        .filter((m) => m.stationId === station.id || m.stationId === null) // include broadcasts
        .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0)),
    [messages, station.id]
  );

  const handleToggleTask = async (id: string) => {
    await toggleTask(id);
  };

  const handleSend = async () => {
    if (!messageText.trim()) return;
    await sendMessage(messageText.trim(), station.id, false);
    setMessageText("");
  };

  const back = () => {
    exitToHome();
    nav("/zone");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setWorkspaceId(null);
    nav("/", { replace: true });
  };

  const renderCategory = (title: string, list: typeof stationTasks) => {
    if (!list.length) return null;
    return (
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neonPurple mb-2">
          {title}
        </h3>
        <div className="space-y-2">
          {list.map((t) => (
            <button
              key={t.id}
              onClick={() => handleToggleTask(t.id)}
              className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                t.completed
                  ? "bg-emerald-900/40 border-emerald-500/60 line-through text-slate-300"
                  : "bg-cardDark/80 border-slate-700/70 hover:border-neonPurple/50"
              }`}
            >
              <span className="w-4 h-4 rounded-full border border-slate-500 flex items-center justify-center">
                {t.completed && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: station.color }}
                  />
                )}
              </span>
              <span>{t.title}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-bgDark via-black to-bgDark text-white">
      <div className="max-w-xl mx-auto px-6 pt-6 pb-20">
        <header className="flex items-center justify-between mb-4 border-b border-slate-700/60 pb-3">
          <button
            onClick={back}
            className="text-slate-300 hover:text-white text-sm"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: station.color }}
            />
            <h1 className="font-semibold">{station.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowChat((v) => !v)}
              className="text-sm text-slate-300 hover:text-neonPurple"
            >
              💬
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-600 text-xs hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </header>

        {showChat ? (
          <div>
            <h2 className="text-lg font-semibold mb-3">
              Chat with Supervisor
            </h2>

            {/* Messages */}
            <div className="mb-4 h-80 bg-cardDark/80 border border-slate-700 rounded-xl p-3 overflow-y-auto space-y-2">
              {stationMessages.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No messages yet. Send the first message to supervisor.
                </p>
              ) : (
                stationMessages.map((msg) => {
                  const isSupervisor = msg.fromSupervisor;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isSupervisor ? "justify-start" : "justify-end"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-xl text-xs shadow-md ${
                          isSupervisor
                            ? "bg-slate-700/90 text-slate-100 rounded-tl-none"
                            : "bg-neonPurple/90 text-white rounded-br-none"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold text-slate-200/80">
                            {isSupervisor ? "SUPERVISOR" : "YOU"}
                          </span>
                          {msg.timestamp && (
                            <span className="text-[9px] text-slate-300/60">
                              {new Date(msg.timestamp).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input */}
            <textarea
              className="w-full min-h-[90px] bg-cardDark/80 border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-neonPurple"
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
            />
            <button
              onClick={handleSend}
              disabled={!messageText.trim()}
              className="mt-3 w-full bg-neonPurple rounded-xl py-2 text-sm font-semibold hover:bg-neonPurple/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Send Message
            </button>
          </div>
        ) : (
          <>
            <section className="mb-8">
              <h2 className="text-lg font-semibold mb-3">Tasks</h2>
              {stationTasks.length === 0 ? (
                <p className="text-slate-400 text-sm">No tasks assigned yet.</p>
              ) : (
                <>
                  {renderCategory("Before Opening", beforeOpening)}
                  {renderCategory("Open Hours", openHours)}
                  {renderCategory("Closing", closing)}
                </>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-3">Scoreboard</h2>
              <div className="space-y-2">
                {scoreboard.map((s, i) => (
                  <div
                    key={s.stationId}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm bg-cardDark/80 border-slate-700/70 ${
                      s.stationId === station.id ? "border-neonPurple" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-neonPurple/20 flex items-center justify-center text-xs font-semibold text-neonPurple">
                        #{i + 1}
                      </span>
                      <div>
                        <div className="font-semibold">{s.stationName}</div>
                        <div className="text-xs text-slate-400">
                          {s.completedTasks}/{s.totalTasks} tasks
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-neonPurple">
                        {s.points}
                      </div>
                      <div className="text-[10px] text-slate-400">pts</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default StationPage;
