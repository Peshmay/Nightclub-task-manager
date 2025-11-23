// src/pages/WorkspacePage.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

import { useApp } from "../AppContext";
import { auth } from "../firebase";
import { api } from "../api";
import type { Workspace } from "../types";

const WorkspacePage: React.FC<{ isAdmin?: boolean }> = ({ isAdmin }) => {
  const nav = useNavigate();
  const { setWorkspaceId } = useApp();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [workspaceName, setWorkspaceName] = useState("");
  const [creating, setCreating] = useState(false);

  // -------- LOAD WORKSPACES (REST, not tRPC) ----------
  const loadWorkspaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      console.error("Failed to load workspaces", err);
      setError("Could not load workspaces from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleSelectWorkspace = async (id: string) => {
    try {
      setWorkspaceId(id);
      localStorage.setItem("workspaceId", id);
      nav("/zone", { replace: true });
    } catch (err) {
      console.error("Failed to select workspace", err);
      alert("Could not select workspace");
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = workspaceName.trim();
    if (!name) return;

    try {
      setCreating(true);
      const workspace = await api.createWorkspace(name);
      // add new one to list + auto-select
      setWorkspaces((prev) => [...prev, workspace]);
      setWorkspaceId(workspace.id);
      localStorage.setItem("workspaceId", workspace.id);
      setWorkspaceName("");
      nav("/zone", { replace: true });
    } catch (err) {
      console.error("Create workspace error", err);
      alert("Could not create workspace");
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error(e);
    }
    setWorkspaceId(null);
    localStorage.removeItem("workspaceId");
    nav("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-black to-[#0a0a0f] text-white">
      <div className="max-w-xl mx-auto px-6 pt-10 pb-20">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <span className="text-neonPurple text-3xl">✦</span>{" "}
              Select Workspace
            </h1>
            <p className="text-slate-400 mt-2">
              Choose your nightclub. Your manager creates workspaces for you.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-600 text-xs hover:bg-slate-800"
          >
            Logout
          </button>
        </header>

        {/* Existing workspaces */}
        <div className="space-y-4 mb-10">
          {loading ? (
            <p className="text-sm text-slate-400">Loading workspaces…</p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : workspaces.length === 0 ? (
            <p className="text-sm text-slate-400">
              No workspaces yet. Ask your manager to create one.
            </p>
          ) : (
            workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws.id)}
                className="w-full text-left rounded-2xl border border-slate-700/70 bg-cardDark/80 px-4 py-4 hover:border-neonPurple/60 hover:bg-cardDark transition flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-600/40 flex items-center justify-center text-lg">
                  🏙️
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{ws.name}</div>
                  <div className="text-xs text-slate-400">
                    Created{" "}
                    {ws.createdAt
                      ? new Date(ws.createdAt).toLocaleDateString()
                      : "recently"}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Create workspace (admin only) */}
        {isAdmin && (
          <div className="rounded-2xl border border-neonPurple/60 bg-gradient-to-r from-neonPurple/20 to-neonCyan/10 px-4 py-5">
            <h2 className="text-lg font-semibold mb-2">
              Create New Workspace
            </h2>
            <p className="text-xs text-slate-300 mb-3">
              Example: <span className="italic">Club Nefertiti</span>
            </p>
            <form
              onSubmit={handleCreateWorkspace}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Workspace name"
                className="flex-1 bg-bgDark border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-neonPurple"
              />
              <button
                type="submit"
                disabled={creating || !workspaceName.trim()}
                className="px-4 py-2 rounded-lg bg-neonPurple text-sm font-semibold hover:bg-neonPurple/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </form>
          </div>
        )}

        {!isAdmin && (
          <p className="text-xs text-slate-500 mt-4">
            Only admins can create new workspaces. Ask your manager to add one
            for you.
          </p>
        )}
      </div>
    </div>
  );
};

export default WorkspacePage;
