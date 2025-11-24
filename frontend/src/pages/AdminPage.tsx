// frontend/src/pages/AdminPage.tsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import { useApp } from "../AppContext";
import { auth } from "../firebase";
import type { Station, Message } from "../types";

type TaskCategory = "before-opening" | "open-hours" | "closing";

const PRESET_COLORS = [
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

const TASK_CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: "before-opening", label: "Before Opening" },
  { value: "open-hours", label: "Open Hours" },
  { value: "closing", label: "Closing" },
];

// helper to turn textarea input into clean email array
const parseAssignees = (text: string): string[] =>
  text
    .split(/[,;\n]/) // comma, semicolon or newline
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

const AdminPage: React.FC = () => {
  const {
    stations,
    tasks,
    messages,
    addStation,
    updateStation,
    deleteStation,
    addTask,
    deleteTask,
    clearAllTasks,
    clearAllMessages,   // NEW
    getScoreboard,
    setWorkspaceId,
    sendMessage,
    changePassword,     // NEW (for PIN)
  } = useApp();

  const nav = useNavigate();
  const userEmail =
    auth.currentUser?.email?.trim().toLowerCase() ?? "manager@nefertiti.com";

  const scoreboard = useMemo(() => getScoreboard(), [getScoreboard]);

  // ---------- LOGOUT ----------
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
    setWorkspaceId(null);
    nav("/", { replace: true });
  };

  // ---------- CLEAR ALL TASKS ----------
  const handleClearAllTasksClick = async () => {
    if (
      !window.confirm(
        "This will mark all tasks for all stations as NOT completed. Continue?"
      )
    )
      return;
    await clearAllTasks();
  };

  // ---------- CLEAR ALL MESSAGES (NEW) ----------
  const handleClearAllMessagesClick = async () => {
    if (
      !window.confirm(
        "This will delete ALL messages in this workspace for everyone. Continue?"
      )
    )
      return;
    await clearAllMessages();
  };

  // ---------- PIN CHANGE (NEW) ----------
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [savingPin, setSavingPin] = useState(false);

  const handleChangePin = async () => {
    const pin = newPin.trim();
    if (!pin) return;

    setSavingPin(true);
    try {
      // reuse existing changePassword from AppContext
      await changePassword(pin);
      alert("PIN updated successfully!");
      setShowPinModal(false);
      setNewPin("");
    } catch (e) {
      console.error(e);
      alert("Failed to update PIN!");
    }
    setSavingPin(false);
  };

  // ---------- STATION CREATE / EDIT ----------
  const [showAddStation, setShowAddStation] = useState(false);
  const [showEditStation, setShowEditStation] = useState(false);
  const [stationName, setStationName] = useState("");
  const [stationColor, setStationColor] = useState(PRESET_COLORS[0]);
  const [editingStationId, setEditingStationId] = useState<string | null>(null);

  // new + edit assignee textareas
  const [newAssigneesText, setNewAssigneesText] = useState("");
  const [editAssigneesText, setEditAssigneesText] = useState("");

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationName.trim()) return;

    const assignees = parseAssignees(newAssigneesText);
    await addStation(stationName.trim(), stationColor, assignees);

    setStationName("");
    setStationColor(PRESET_COLORS[0]);
    setNewAssigneesText("");
    setShowAddStation(false);
  };

  const handleStartEditStation = (station: Station) => {
    setEditingStationId(station.id);
    setStationName(station.name);
    setStationColor(station.color);
    setEditAssigneesText((station.assignees ?? []).join(", "));
    setShowEditStation(true);
  };

  const handleEditStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStationId || !stationName.trim()) return;

    const assignees = parseAssignees(editAssigneesText);

    await updateStation(editingStationId, {
      name: stationName.trim(),
      color: stationColor,
      assignees,
    });

    setEditingStationId(null);
    setStationName("");
    setStationColor(PRESET_COLORS[0]);
    setEditAssigneesText("");
    setShowEditStation(false);
  };

  const handleConfirmDeleteStation = async (id: string) => {
    if (
      !window.confirm(
        "Delete station and all its tasks? This cannot be undone."
      )
    )
      return;
    await deleteStation(id);
  };

  // ---------- TASK CREATE / DELETE ----------
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    null
  );
  const [taskTitle, setTaskTitle] = useState("");
  const [taskCategory, setTaskCategory] =
    useState<TaskCategory>("before-opening");

  const openAddTask = (stationId: string) => {
    setSelectedStationId(stationId);
    setTaskTitle("");
    setTaskCategory("before-opening");
    setShowAddTask(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStationId || !taskTitle.trim()) return;
    await addTask(selectedStationId, taskTitle.trim(), taskCategory);
    setTaskTitle("");
    setTaskCategory("before-opening");
    setSelectedStationId(null);
    setShowAddTask(false);
  };

  const handleConfirmDeleteTask = async (id: string) => {
    if (!window.confirm("Delete this task?")) return;
    await deleteTask(id);
  };

  // ---------- NAVIGATION ----------
  const handleBack = () => {
    nav("/zone");
  };

  // ---------- MESSAGE BOARD (ADMIN) ----------
  const [adminMessageText, setAdminMessageText] = useState("");
  const [adminTargetStationId, setAdminTargetStationId] = useState<
    string | "all"
  >("all");

  const sortedMessages: Message[] = useMemo(
    () =>
      [...messages].sort((a, b) => {
        const ta = a.timestamp ?? 0;
        const tb = b.timestamp ?? 0;
        return ta - tb; // oldest at top
      }),
    [messages]
  );

  const handleAdminSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = adminMessageText.trim();
    if (!text) return;

    const stationId =
      adminTargetStationId === "all" ? null : adminTargetStationId;

    await sendMessage(text, stationId, true); // fromSupervisor = true
    setAdminMessageText("");
  };

  const getStationName = (stationId: string | null) => {
    if (!stationId) return "ALL STATIONS";
    const s = stations.find((st) => st.id === stationId);
    return s ? s.name : "Unknown station";
  };

  // ---------- RENDER ----------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#1a0a2e] to-[#0a0a0f] text-white">
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <button
          onClick={handleBack}
          className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-600 text-xs hover:bg-slate-800"
        >
          ← Back
        </button>

        <h1 className="text-xl font-bold">Admin Panel</h1>

        <div className="flex items-center gap-2">
          <button
            onClick={handleClearAllTasksClick}
            className="px-3 py-1 rounded-lg bg-red-900/40 border border-red-500/60 text-xs hover:bg-red-800/60"
          >
            Clear Tasks
          </button>

          <button
            onClick={handleClearAllMessagesClick}
            className="px-3 py-1 rounded-lg bg-yellow-700/40 border border-yellow-500/60 text-xs hover:bg-yellow-600/60"
          >
            Clear Messages
          </button>

          <button
            onClick={() => setShowPinModal(true)}
            className="px-3 py-1 rounded-lg bg-purple-700/40 border border-purple-500/60 text-xs hover:bg-purple-600/60"
          >
            Change PIN
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-600 text-xs hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 py-6 space-y-8">
        {/* ====== MESSAGE BOARD ====== */}
        <section className="grid gap-4 md:grid-cols-[2fr,1fr] items-start">
          {/* Messages list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Messages</h2>
            </div>
            <div className="h-64 md:h-72 bg-black/30 border border-white/10 rounded-2xl p-3 overflow-y-auto space-y-3">
              {sortedMessages.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Staff messages will appear here.
                </p>
              ) : (
                sortedMessages.map((msg) => {
                  const isAdminMessage = msg.fromSupervisor;
                  const stationName = getStationName(msg.stationId);

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isAdminMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-xl text-xs md:text-sm shadow-md ${
                          isAdminMessage
                            ? "bg-cyan-600/80 text-white rounded-br-none"
                            : "bg-slate-700/80 text-slate-100 rounded-tl-none"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold ${
                              isAdminMessage
                                ? "text-cyan-200"
                                : "text-purple-200"
                            }`}
                          >
                            {isAdminMessage ? "ADMIN" : "STAFF"}
                          </span>
                          <span className="text-[9px] text-slate-200/70 italic">
                            {stationName}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Send message form */}
          <div className="bg-[#1a1a2e]/90 border border-white/10 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">Broadcast / Reply</h3>
            <div className="space-y-2">
              <label className="text-[11px] text-slate-400">
                Target station
              </label>
              <select
                value={adminTargetStationId}
                onChange={(e) =>
                  setAdminTargetStationId(
                    e.target.value === "all" ? "all" : e.target.value
                  )
                }
                className="w-full bg-black/40 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">All stations</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <form onSubmit={handleAdminSendMessage} className="space-y-2">
              <textarea
                value={adminMessageText}
                onChange={(e) => setAdminMessageText(e.target.value)}
                placeholder="Send a message to staff..."
                className="w-full bg-black/40 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[80px]"
              />
              <button
                type="submit"
                disabled={!adminMessageText.trim()}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Send (Admin message)
              </button>
            </form>
          </div>
        </section>

        {/* ====== SCOREBOARD ====== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Scoreboard</h2>
          </div>
          <div className="space-y-3">
            {scoreboard.length === 0 ? (
              <p className="text-sm text-slate-400">
                No stations yet. Add a station below.
              </p>
            ) : (
              scoreboard.map((score, idx) => (
                <div
                  key={score.stationId}
                  className="flex items-center gap-3 bg-[#1a1a2e]/90 border border-white/10 rounded-2xl px-4 py-3"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center text-sm font-bold text-purple-300">
                    #{idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{score.stationName}</div>
                    <div className="text-xs text-slate-400">
                      {score.completedTasks}/{score.totalTasks} tasks completed
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-400">
                      {score.points}
                    </div>
                    <div className="text-[10px] uppercase tracking-wide text-slate-500">
                      pts
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ====== STATIONS + TASKS ====== */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Stations</h2>
            <button
              onClick={() => {
                setStationName("");
                setStationColor(PRESET_COLORS[0]);
                setNewAssigneesText("");
                setShowAddStation(true);
              }}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold"
            >
              + Add Station
            </button>
          </div>

          <div className="space-y-4">
            {stations.length === 0 ? (
              <p className="text-sm text-slate-400">
                No stations. Add Bar, Entrance, Washing Room, Kitchen, etc.
              </p>
            ) : (
              stations.map((station) => {
                const stationTasks = tasks.filter(
                  (t) => t.stationId === station.id
                );
                const before = stationTasks.filter(
                  (t) => t.category === "before-opening"
                );
                const open = stationTasks.filter(
                  (t) => t.category === "open-hours"
                );
                const closing = stationTasks.filter(
                  (t) => t.category === "closing"
                );

                const renderCategory = (
                  label: string,
                  list: typeof stationTasks
                ) =>
                  list.length === 0 ? null : (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-purple-300">
                        {label}
                      </h4>
                      <div className="space-y-1.5">
                        {list.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm"
                          >
                            <span>{task.title}</span>
                            <button
                              onClick={() => handleConfirmDeleteTask(task.id)}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
return (
  <div
    key={station.id}
    className="border border-white/10 rounded-2xl px-4 py-4 space-y-3 relative overflow-hidden"
    style={{
      background: `linear-gradient(135deg, ${station.color}33, #050515 60%)`,
    }}
                >
                    {/* Station header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: station.color }}
                        />
                        <span className="font-semibold text-lg">
                          {station.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {stationTasks.length} tasks
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEditStation(station)}
                          className="text-xs px-2 py-1 rounded-md border border-slate-500 text-slate-200 hover:bg-slate-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            handleConfirmDeleteStation(station.id)
                          }
                          className="text-xs px-2 py-1 rounded-md border border-red-500 text-red-400 hover:bg-red-900/40"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => openAddTask(station.id)}
                          className="text-xs px-2 py-1 rounded-md bg-purple-600 hover:bg-purple-500"
                        >
                          + Task
                        </button>
                      </div>
                    </div>

                    {/* Tasks by category */}
                    <div className="grid gap-3 md:grid-cols-3">
                      {renderCategory("Before Opening", before)}
                      {renderCategory("Open Hours", open)}
                      {renderCategory("Closing", closing)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* ADD STATION MODAL */}
      {showAddStation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Add Station</h3>
              <button
                onClick={() => setShowAddStation(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateStation} className="space-y-4">
              <input
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                placeholder="Station name (e.g. Big Bar, Entrance)"
                className="w-full bg-black/40 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />

              <div>
                <p className="text-xs text-slate-400 mb-1">Color</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setStationColor(c)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        stationColor === c ? "border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">
                  Assign staff emails (optional)
                </p>
                <textarea
                  value={newAssigneesText}
                  onChange={(e) => setNewAssigneesText(e.target.value)}
                  placeholder="bar1@nefertiti.com, entrance@nefertiti.com"
                  className="w-full bg-black/40 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[60px]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Separate emails with comma, semicolon or new lines.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold"
              >
                Add Station
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STATION MODAL */}
      {showEditStation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Edit Station</h3>
              <button
                onClick={() => setShowEditStation(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditStation} className="space-y-4">
              <input
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                placeholder="Station name"
                className="w-full bg-black/40 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div>
                <p className="text-xs text-slate-400 mb-1">Color</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setStationColor(c)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        stationColor === c ? "border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">
                  Assigned staff emails
                </p>
                <textarea
                  value={editAssigneesText}
                  onChange={(e) => setEditAssigneesText(e.target.value)}
                  placeholder="bar1@nefertiti.com, entrance@nefertiti.com"
                  className="w-full bg-black/40 border border-slate-600 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[60px]"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Separate emails with comma, semicolon or new lines.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD TASK MODAL */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Add Task</h3>
              <button
                onClick={() => setShowAddTask(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task title (e.g. Turn on neon sign)"
                className="w-full bg-black/40 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div>
                <p className="text-xs text-slate-400 mb-1">Category</p>
                <select
                  value={taskCategory}
                  onChange={(e) =>
                    setTaskCategory(e.target.value as TaskCategory)
                  }
                  className="w-full bg-black/40 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {TASK_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold"
              >
                Add Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PIN MODAL (NEW) */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-semibold">Change Admin PIN</h3>

            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Enter new PIN"
              className="w-full bg-black/40 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                className="px-3 py-1 rounded-lg bg-slate-700 border border-slate-600 text-sm"
                onClick={() => setShowPinModal(false)}
              >
                Cancel
              </button>

              <button
                disabled={!newPin.trim() || savingPin}
                onClick={handleChangePin}
                className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold disabled:opacity-50"
              >
                {savingPin ? "Saving..." : "Save PIN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
