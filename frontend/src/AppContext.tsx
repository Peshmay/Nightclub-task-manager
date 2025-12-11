// frontend/src/AppContext.tsx
import React,
{
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./api";

import type {
  Station,
  Task,
  Message,
  AppSettings,
  StationScore,
} from "./types";

type TaskCategory = "before-opening" | "open-hours" | "closing";

interface AppContextValue {
  stations: Station[];
  tasks: Task[];
  messages: Message[];
  settings: AppSettings | null;
  workspaceId: string | null;
  isLoading: boolean;
  selectedStationId: string | null;
  isAdmin: boolean;

  setWorkspaceId: (id: string | null) => void;

  addStation: (name: string, color: string, assignees?: string[]) => Promise<void>;
  updateStation: (
    id: string,
    data: { name?: string; color?: string; assignees?: string[] }
  ) => Promise<void>;
  deleteStation: (id: string) => Promise<void>;

  addTask: (
    stationId: string,
    title: string,
    category: TaskCategory
  ) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearAllTasks: () => Promise<void>;

  sendMessage: (
    text: string,
    stationId: string | null,
    fromSupervisor: boolean,
    replyTo?: string
  ) => Promise<void>;
  clearAllMessages: () => Promise<void>;

  verifyPassword: (password: string) => boolean;
  changePassword: (newPassword: string) => Promise<void>;
  getScoreboard: () => StationScore[];

  selectStation: (stationId: string | null) => void;
  enterAdminMode: () => void;
  exitToHome: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // --- CORE STATE ---

  // ✅ Initialize workspaceId directly from localStorage instead of useEffect
  const [workspaceId, setWorkspaceIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("workspaceId");
  });

  const [stations, setStations] = useState<Station[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  // no async loading here any more, so just false:
  const [isLoading] = useState(false);

  // --- WORKSPACE ID management ---

  const setWorkspaceId = useCallback((id: string | null) => {
    setWorkspaceIdState(id);
    if (id) {
      localStorage.setItem("workspaceId", id);
    } else {
      localStorage.removeItem("workspaceId");
    }
  }, []);

  // --- POLLING LOOP FOR DATA ---

  useEffect(() => {
    if (!workspaceId) return;
    let cancelled = false;

    const loadOnce = async () => {
      try {
        const [s, t, m, st] = await Promise.all([
          api.getStations(workspaceId),
          api.getTasks(workspaceId),
          api.getMessages(workspaceId),
          api.getSettings(workspaceId),
        ]);
        if (!cancelled) {
          setStations(s);
          setTasks(t);
          setMessages(m);
          setSettings(st);
        }
      } catch (err) {
        console.error("Failed to load workspace data", err);
      }
    };

    loadOnce();
    const id = setInterval(loadOnce, 3000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [workspaceId]);

  // --- REFRESH HELPERS ---

  const refreshTasks = useCallback(async () => {
    if (!workspaceId) return;
    const t = await api.getTasks(workspaceId);
    setTasks(t);
  }, [workspaceId]);

  const refreshStations = useCallback(async () => {
    if (!workspaceId) return;
    const s = await api.getStations(workspaceId);
    setStations(s);
  }, [workspaceId]);

  const refreshMessages = useCallback(async () => {
    if (!workspaceId) return;
    const m = await api.getMessages(workspaceId);
    setMessages(m);
  }, [workspaceId]);

  const refreshSettings = useCallback(async () => {
    if (!workspaceId) return;
    const st = await api.getSettings(workspaceId);
    setSettings(st);
  }, [workspaceId]);

  // --- STATIONS ---

  const addStation = useCallback(
    async (name: string, color: string, assignees?: string[]) => {
      if (!workspaceId) return;
      await api.addStation(workspaceId, name, color, assignees);
      await refreshStations();
    },
    [workspaceId, refreshStations]
  );

  const updateStation = useCallback(
    async (
      id: string,
      data: { name?: string; color?: string; assignees?: string[] }
    ) => {
      if (!workspaceId) return;
      const station = stations.find((s) => s.id === id);
      if (!station) return;

      const name = data.name ?? station.name;
      const color = data.color ?? station.color;
      const assignees = data.assignees ?? station.assignees ?? [];

      await api.updateStation(workspaceId, id, name, color, assignees);
      await refreshStations();
    },
    [workspaceId, refreshStations, stations]
  );

  const deleteStation = useCallback(
    async (id: string) => {
      if (!workspaceId) return;
      await api.deleteStation(workspaceId, id);
      await refreshStations();
      await refreshTasks();
    },
    [workspaceId, refreshStations, refreshTasks]
  );

  // --- TASKS ---

  const addTask = useCallback(
    async (
      stationId: string,
      title: string,
      category: TaskCategory
    ) => {
      if (!workspaceId) return;
      await api.addTask(workspaceId, stationId, title, category);
      await refreshTasks();
    },
    [workspaceId, refreshTasks]
  );

  const toggleTask = useCallback(
    async (id: string) => {
      if (!workspaceId) return;
      await api.toggleTask(workspaceId, id);
      await refreshTasks();
    },
    [workspaceId, refreshTasks]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      if (!workspaceId) return;
      await api.deleteTask(workspaceId, id);
      await refreshTasks();
    },
    [workspaceId, refreshTasks]
  );

  const clearAllTasks = useCallback(async () => {
    if (!workspaceId) return;
    await api.clearAllTasks(workspaceId);
    await refreshTasks();
  }, [workspaceId, refreshTasks]);

  // --- MESSAGES ---

  const sendMessage = useCallback(
    async (
      text: string,
      stationId: string | null,
      fromSupervisor: boolean,
      replyTo?: string
    ) => {
      if (!workspaceId) return;
      await api.sendMessage(
        workspaceId,
        text,
        stationId,
        fromSupervisor,
        replyTo
      );
      await refreshMessages();
    },
    [workspaceId, refreshMessages]
  );

  const clearAllMessages = useCallback(async () => {
    if (!workspaceId) return;
    await api.clearMessages(workspaceId);
    await refreshMessages();
  }, [workspaceId, refreshMessages]);

  // --- ADMIN PASSWORD ---

  const verifyPassword = useCallback(
    (password: string): boolean => {
      if (!settings) return false;
      return password === settings.adminPassword;
    },
    [settings]
  );

  const changePassword = useCallback(
    async (newPassword: string) => {
      if (!workspaceId) return;
      await api.updatePassword(workspaceId, newPassword);
      await refreshSettings();
    },
    [workspaceId, refreshSettings]
  );

  // --- SCOREBOARD ---

  const getScoreboard = useCallback((): StationScore[] => {
    return stations
      .map((station) => {
        const stationTasks = tasks.filter((t) => t.stationId === station.id);
        const completedTasks = stationTasks.filter((t) => t.completed).length;
        return {
          stationId: station.id,
          stationName: station.name,
          points: completedTasks,
          completedTasks,
          totalTasks: stationTasks.length,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [stations, tasks]);

  // --- UI MODE HELPERS ---

  const selectStation = useCallback((stationId: string | null) => {
    setSelectedStationId(stationId);
    setIsAdmin(false);
  }, []);

  const enterAdminMode = useCallback(() => {
    setIsAdmin(true);
    setSelectedStationId(null);
  }, []);

  const exitToHome = useCallback(() => {
    setIsAdmin(false);
    setSelectedStationId(null);
  }, []);

  // --- CONTEXT VALUE ---

  const value: AppContextValue = useMemo(
    () => ({
      stations,
      tasks,
      messages,
      settings,
      workspaceId,
      isLoading,
      selectedStationId,
      isAdmin,

      setWorkspaceId,

      addStation,
      updateStation,
      deleteStation,

      addTask,
      toggleTask,
      deleteTask,
      clearAllTasks,

      sendMessage,
      clearAllMessages,

      verifyPassword,
      changePassword,
      getScoreboard,

      selectStation,
      enterAdminMode,
      exitToHome,
    }),
    [
      stations,
      tasks,
      messages,
      settings,
      workspaceId,
      isLoading,
      selectedStationId,
      isAdmin,
      setWorkspaceId,
      addStation,
      updateStation,
      deleteStation,
      addTask,
      toggleTask,
      deleteTask,
      clearAllTasks,
      sendMessage,
      clearAllMessages, // ✅ include this
      verifyPassword,
      changePassword,
      getScoreboard,
      selectStation,
      enterAdminMode,
      exitToHome,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
