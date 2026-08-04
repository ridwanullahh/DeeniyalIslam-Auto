/**
 * GET  /api/admin/adhkar   — list adhkar (search, filter by category)
 * POST /api/admin/adhkar   — create
 */
import { z } from "zod";
import { makeCrudHandlers } from "@/lib/admin/crud-factory";

const handlers = makeCrudHandlers({
  collection: "adhkar",
  auditPrefix: "adhkar",
  sort: "category:asc,order:asc",
  searchableFields: ["arabic", "translation", "transliteration"],
  filterFields: {
    category: (v) => ({ field: "category", op: "eq", value: v }),
  },
  shape: {
    category: z.enum(["morning", "evening", "sleep", "after_prayer", "after_wudu", "travel", "food", "distress", "protection", "tahleel"]),
    arabic: z.string().min(1),
    transliteration: z.string().optional(),
    translation: z.string().min(1),
    repeatCount: z.number().int().min(1).max(1000).default(1),
    source: z.string().optional(),
    tags: z.array(z.string()).optional(),
    order: z.number().int().default(0),
  },
});

export const GET = handlers.list;
export const POST = handlers.create;
