import type { TaskCategory, Station, Task, Message, AppSettings, Workspace } from './types';

/**
 * Set VITE_API_BASE_URL to your backend ORIGIN (no /api), e.g:
 * - http://localhost:4001
 * - https://nefertiti-backend.onrender.com
 *
 * This file will automatically call `${ORIGIN}/api/...`
 */
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001') as string;

// Backend routes are mounted on /api in index.ts
const API_BASE = `${API_ORIGIN.replace(/\/$/, '')}/api`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  // Safe JSON parsing
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return (await res.text()) as T;
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Workspaces
  getWorkspaces: () => request<Workspace[]>('/workspaces'),
  createWorkspace: (name: string) =>
    request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  // Stations
  getStations: (workspaceId: string) =>
    request<Station[]>(`/stations?workspaceId=${encodeURIComponent(workspaceId)}`),

  addStation: (workspaceId: string, name: string, color: string, assignees?: string[]) =>
    request<Station>('/stations', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, name, color, assignees }),
    }),

  updateStation: (
    workspaceId: string,
    id: string,
    name: string,
    color: string,
    assignees?: string[],
  ) =>
    request<{ ok: true }>(`/stations/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ workspaceId, name, color, assignees }),
    }),

  deleteStation: (workspaceId: string, id: string) =>
    request<{ ok: true }>(`/stations/${id}?workspaceId=${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
    }),

  // Tasks
  getTasks: (workspaceId: string) =>
    request<Task[]>(`/tasks?workspaceId=${encodeURIComponent(workspaceId)}`),

  addTask: (workspaceId: string, stationId: string, title: string, category: TaskCategory) =>
    request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, stationId, title, category }),
    }),

  toggleTask: (workspaceId: string, id: string) =>
    request<{ ok: true }>('/tasks/toggle', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, id }),
    }),

  deleteTask: (workspaceId: string, id: string) =>
    request<{ ok: true }>(`/tasks/${id}?workspaceId=${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
    }),

  clearAllTasks: (workspaceId: string) =>
    request<{ ok: true }>('/tasks/clear-all', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    }),

  // Messages
  getMessages: (workspaceId: string) =>
    request<Message[]>(`/messages?workspaceId=${encodeURIComponent(workspaceId)}`),

  sendMessage: (
    workspaceId: string,
    text: string,
    stationId: string | null,
    fromSupervisor: boolean,
    replyTo?: string,
  ) =>
    request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify({
        workspaceId,
        text,
        stationId,
        fromSupervisor,
        replyTo,
      }),
    }),

  clearAllMessages: (workspaceId: string) =>
    request<{ ok: true }>('/messages/clear-all', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    }),

  // Settings
  getSettings: (workspaceId: string) =>
    request<AppSettings>(`/settings?workspaceId=${encodeURIComponent(workspaceId)}`),

  updatePassword: (workspaceId: string, newPassword: string) =>
    request<{ ok: true }>('/settings/password', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, newPassword }),
    }),
};
