import { TaskCategory, Station, Task, Message, AppSettings, Workspace } from './types';

const API_BASE = '/api';
import.meta.env.VITE_API_BASE_URL || '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export const api = {
  getWorkspaces: () => request<Workspace[]>('/workspaces'),
  createWorkspace: (name: string) =>
    request<Workspace>('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

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
    request('/stations/' + id, {
      method: 'PUT',
      body: JSON.stringify({ workspaceId, name, color, assignees }),
    }),

  deleteStation: (workspaceId: string, id: string) =>
    request(`/stations/${id}?workspaceId=${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
    }),

  getTasks: (workspaceId: string) =>
    request<Task[]>(`/tasks?workspaceId=${encodeURIComponent(workspaceId)}`),
  addTask: (workspaceId: string, stationId: string, title: string, category: TaskCategory) =>
    request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, stationId, title, category }),
    }),
  toggleTask: (workspaceId: string, id: string) =>
    request('/tasks/toggle', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, id }),
    }),
  deleteTask: (workspaceId: string, id: string) =>
    request(`/tasks/${id}?workspaceId=${encodeURIComponent(workspaceId)}`, {
      method: 'DELETE',
    }),
  clearAllTasks: (workspaceId: string) =>
    request('/tasks/clear-all', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    }),

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
    request('/messages/clear-all', {
      method: 'POST',
      body: JSON.stringify({ workspaceId }),
    }),

  getSettings: (workspaceId: string) =>
    request<AppSettings>(`/settings?workspaceId=${encodeURIComponent(workspaceId)}`),
  updatePassword: (workspaceId: string, newPassword: string) =>
    request('/settings/password', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, newPassword }),
    }),
};
