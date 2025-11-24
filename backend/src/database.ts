import {
  Workspace,
  Station,
  Task,
  Message,
  AppSettings,
  TaskCategory,
} from "./types";

const DEFAULT_PASSWORD = "9999";

export const DEFAULT_STATIONS: Omit<Station, "workspaceId">[] = [
  { id: "1", name: "Bar", color: "#a855f7" },
  { id: "2", name: "Entrance", color: "#06b6d4" },
  { id: "3", name: "Washing Room", color: "#ec4899" },
  { id: "4", name: "Kitchen", color: "#f59e0b" },
];

export class Database {
  private workspaces = new Map<string, Workspace>();
  private stations = new Map<string, Station[]>();
  private tasks = new Map<string, Task[]>();
  private messages = new Map<string, Message[]>();
  private settings = new Map<string, AppSettings>();

  createWorkspace(name: string): Workspace {
    const workspace: Workspace = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name,
      createdAt: Date.now(),
    };
    this.workspaces.set(workspace.id, workspace);
    this.stations.set(
      workspace.id,
      DEFAULT_STATIONS.map((s) => ({ ...s, workspaceId: workspace.id }))
    );
    this.tasks.set(workspace.id, []);
    this.messages.set(workspace.id, []);
    this.settings.set(workspace.id, {
      workspaceId: workspace.id,
      adminPassword: DEFAULT_PASSWORD,
    });
    return workspace;
  }

  getWorkspace(workspaceId: string): Workspace | undefined {
    return this.workspaces.get(workspaceId);
  }

  getAllWorkspaces(): Workspace[] {
    return Array.from(this.workspaces.values());
  }

  getStations(workspaceId: string): Station[] {
    return this.stations.get(workspaceId) || [];
  }

  addStation(workspaceId: string, station: Station): void {
    const workspaceStations = this.stations.get(workspaceId) || [];
    workspaceStations.push(station);
    this.stations.set(workspaceId, workspaceStations);
  }

  updateStation(
    workspaceId: string,
    id: string,
    name: string,
    color: string
  ): void {
    const workspaceStations = this.stations.get(workspaceId) || [];
    const index = workspaceStations.findIndex((s) => s.id === id);
    if (index !== -1) {
      workspaceStations[index] = { ...workspaceStations[index], name, color };
      this.stations.set(workspaceId, workspaceStations);
    }
  }

  deleteStation(workspaceId: string, id: string): void {
    const workspaceStations = this.stations.get(workspaceId) || [];
    this.stations.set(
      workspaceId,
      workspaceStations.filter((s) => s.id !== id)
    );
    const workspaceTasks = this.tasks.get(workspaceId) || [];
    this.tasks.set(
      workspaceId,
      workspaceTasks.filter((t) => t.stationId !== id)
    );
  }

  getTasks(workspaceId: string): Task[] {
    return this.tasks.get(workspaceId) || [];
  }

  addTask(workspaceId: string, task: Task): void {
    const workspaceTasks = this.tasks.get(workspaceId) || [];
    workspaceTasks.push(task);
    this.tasks.set(workspaceId, workspaceTasks);
  }

  updateTask(workspaceId: string, id: string, updates: Partial<Task>): void {
    const workspaceTasks = this.tasks.get(workspaceId) || [];
    const index = workspaceTasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      workspaceTasks[index] = { ...workspaceTasks[index], ...updates };
      this.tasks.set(workspaceId, workspaceTasks);
    }
  }

  deleteTask(workspaceId: string, id: string): void {
    const workspaceTasks = this.tasks.get(workspaceId) || [];
    this.tasks.set(
      workspaceId,
      workspaceTasks.filter((t) => t.id !== id)
    );
  }

  clearAllTasks(workspaceId: string): void {
    const workspaceTasks = this.tasks.get(workspaceId) || [];
    this.tasks.set(
      workspaceId,
      workspaceTasks.map((t) => ({
        ...t,
        completed: false,
        completedAt: undefined,
      }))
    );
  }

  getMessages(workspaceId: string): Message[] {
    return this.messages.get(workspaceId) || [];
  }

  addMessage(workspaceId: string, message: Message): void {
    const workspaceMessages = this.messages.get(workspaceId) || [];
    workspaceMessages.push(message);
    this.messages.set(workspaceId, workspaceMessages);
  }

  clearMessages(workspaceId: string) {
    this.messages.delete(workspaceId);
  }

  getSettings(workspaceId: string): AppSettings {
    return (
      this.settings.get(workspaceId) || {
        workspaceId,
        adminPassword: DEFAULT_PASSWORD,
      }
    );
  }

  updatePassword(workspaceId: string, newPassword: string): void {
    const workspaceSettings = this.settings.get(workspaceId) || {
      workspaceId,
      adminPassword: DEFAULT_PASSWORD,
    };
    workspaceSettings.adminPassword = newPassword;
    this.settings.set(workspaceId, workspaceSettings);
  }
}

export const db = new Database();
