/**
 * GET  /api/admin/reminders  — list reminders (search, filter by category/language)
 * POST /api/admin/reminders  — create
 */
import { z } from "zod";
import { makeCrudHandlers } from "@/lib/admin/crud-factory";

const handlers = makeCrudHandlers({
  collection: "reminders",
  auditPrefix: "reminder",
  sort: "category:asc",
  searchableFields: ["title", "body"],
  filterFields: {
    category: (v) => ({ field: "category", op: "eq", value: v }),
    language: (v) => ({ field: "language", op: "eq", value: v }),
  },
  shape: {
    title: z.string().min(1).max(200),
    body: z.string().min(1),
    category: z.enum(["general", "warning", "encouragement", "character", "worship", "character_building", "ethics"]),
    language: z.enum(["en", "ar", "fr", "ha", "yo", "sw"]).default("en"),
    source: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublished: z.boolean().default(true),
  },
});

export const GET = handlers.list;
export const POST = handlers.create;
