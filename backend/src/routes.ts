import express from "express";
import { db } from "./database";
import {
  workspaceCreateSchema,
  workspaceIdSchema,
  stationCreateSchema,
  stationUpdateSchema,
  idSchema,
  taskCreateSchema,
  taskToggleSchema,
  messageCreateSchema,
  passwordUpdateSchema,
} from "./schemas";
import { Task } from "./types";

export const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Workspaces
router.get("/workspaces", (_req, res) => {
  res.json(db.getAllWorkspaces());
});

router.post("/workspaces", (req, res) => {
  const parse = workspaceCreateSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json(parse.error.flatten());
  }
  const ws = db.createWorkspace(parse.data.name);
  res.status(201).json(ws);
});

// Stations
router.get("/stations", (req, res) => {
  const parse = workspaceIdSchema.safeParse(req.query);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  res.json(db.getStations(parse.data.workspaceId));
});

router.post("/stations", (req, res) => {
  const parse = stationCreateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  const { workspaceId, name, color } = parse.data;
  const station = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    workspaceId,
    name,
    color,
  };
  db.addStation(workspaceId, station);
  res.status(201).json(station);
});

router.put("/stations/:id", (req, res) => {
  const params = workspaceIdSchema.extend(idSchema.shape).safeParse({
    workspaceId: req.body.workspaceId,
    id: req.params.id,
  });
  if (!params.success) return res.status(400).json(params.error.flatten());
  const body = stationUpdateSchema.safeParse({
    workspaceId: params.data.workspaceId,
    id: params.data.id,
    name: req.body.name,
    color: req.body.color,
  });
  if (!body.success) return res.status(400).json(body.error.flatten());
  db.updateStation(
    body.data.workspaceId,
    body.data.id,
    body.data.name,
    body.data.color
  );
  res.json({ ok: true });
});

router.delete("/stations/:id", (req, res) => {
  const params = workspaceIdSchema.extend(idSchema.shape).safeParse({
    workspaceId: req.query.workspaceId,
    id: req.params.id,
  });
  if (!params.success) return res.status(400).json(params.error.flatten());
  db.deleteStation(params.data.workspaceId, params.data.id);
  res.json({ ok: true });
});

// Tasks
router.get("/tasks", (req, res) => {
  const parse = workspaceIdSchema.safeParse(req.query);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  res.json(db.getTasks(parse.data.workspaceId));
});

router.post("/tasks", (req, res) => {
  const parse = taskCreateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  const { workspaceId, stationId, title, category } = parse.data;
  const task: Task = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    workspaceId,
    stationId,
    title,
    category,
    completed: false,
    createdAt: Date.now(),
  };
  db.addTask(workspaceId, task);
  res.status(201).json(task);
});

router.post("/tasks/toggle", (req, res) => {
  const parse = taskToggleSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  const tasks = db.getTasks(parse.data.workspaceId);
  const task = tasks.find((t) => t.id === parse.data.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  db.updateTask(parse.data.workspaceId, task.id, {
    completed: !task.completed,
    completedAt: !task.completed ? Date.now() : undefined,
  });
  res.json({ ok: true });
});

router.delete("/tasks/:id", (req, res) => {
  const params = workspaceIdSchema.extend(idSchema.shape).safeParse({
    workspaceId: req.query.workspaceId,
    id: req.params.id,
  });
  if (!params.success) return res.status(400).json(params.error.flatten());
  db.deleteTask(params.data.workspaceId, params.data.id);
  res.json({ ok: true });
});

router.post("/tasks/clear-all", (req, res) => {
  const parse = workspaceIdSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  db.clearAllTasks(parse.data.workspaceId);
  res.json({ ok: true });
});

// Messages
// Messages
router.get("/messages", (req, res) => {
  const parse = workspaceIdSchema.safeParse(req.query);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  res.json(db.getMessages(parse.data.workspaceId));
});

router.post("/messages", (req, res) => {
  const parse = messageCreateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  const { workspaceId, stationId, text, fromSupervisor, replyTo } = parse.data;
  const message = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    workspaceId,
    stationId,
    text,
    fromSupervisor,
    replyTo,
    timestamp: Date.now(),
  };
  db.addMessage(workspaceId, message);
  res.status(201).json(message);
});

// NEW: clear all messages for a workspace
router.post("/messages/clear-all", (req, res) => {
  const parse = workspaceIdSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  db.clearAllMessages(parse.data.workspaceId);
  res.json({ ok: true });
});

// Settings
router.get("/settings", (req, res) => {
  const parse = workspaceIdSchema.safeParse(req.query);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  res.json(db.getSettings(parse.data.workspaceId));
});

router.post("/settings/password", (req, res) => {
  const parse = passwordUpdateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json(parse.error.flatten());
  db.updatePassword(parse.data.workspaceId, parse.data.newPassword);
  res.json({ ok: true });
});
