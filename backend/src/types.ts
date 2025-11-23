export type TaskCategory = "before-opening" | "open-hours" | "closing";

export interface Workspace {
  id: string;
  name: string;
  createdAt: number;
}

export interface Station {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  workspaceId: string;
  stationId: string;
  title: string;
  category: TaskCategory;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
}

export interface Message {
  id: string;
  workspaceId: string;
  stationId: string | null;
  text: string;
  fromSupervisor: boolean;
  timestamp: number;
  replyTo?: string;
}

export interface AppSettings {
  workspaceId: string;
  adminPassword: string;
}

export interface StationScore {
  stationId: string;
  stationName: string;
  points: number;
  completedTasks: number;
  totalTasks: number;
}
