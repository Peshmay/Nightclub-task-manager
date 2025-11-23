// frontend/src/trpc.ts
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../backend/src/routes";
// ^ this path must point to the file where you export `export type AppRouter = typeof appRouter;`

export const trpc = createTRPCReact<AppRouter>();
