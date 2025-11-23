import { z } from "zod";

export const workspaceCreateSchema = z.object({
  name: z.string().min(1)
});

export const workspaceIdSchema = z.object({
  workspaceId: z.string().min(1)
});

export const stationCreateSchema = workspaceIdSchema.extend({
  name: z.string().min(1),
  color: z.string().min(1)
});

export const stationUpdateSchema = workspaceIdSchema.extend({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1)
});

export const idSchema = z.object({
  id: z.string().min(1)
});

export const taskCreateSchema = workspaceIdSchema.extend({
  stationId: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(["before-opening", "open-hours", "closing"])
});

export const taskToggleSchema = workspaceIdSchema.extend({
  id: z.string().min(1)
});

export const messageCreateSchema = workspaceIdSchema.extend({
  stationId: z.string().nullable(),
  text: z.string().min(1),
  fromSupervisor: z.boolean(),
  replyTo: z.string().optional()
});

export const passwordUpdateSchema = workspaceIdSchema.extend({
  newPassword: z.string().length(4)
});
