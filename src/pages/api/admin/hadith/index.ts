/**
 * GET  /api/admin/hadith   — list hadiths (search by textEn/textAr, filter by collection)
 * POST /api/admin/hadith   — create
 */
import { z } from "zod";
import { makeCrudHandlers } from "@/lib/admin/crud-factory";

const handlers = makeCrudHandlers({
  collection: "hadiths",
  auditPrefix: "hadith",
  sort: "collection:asc,hadithNumber:asc",
  searchableFields: ["textEn", "textAr", "narratorEn"],
  filterFields: {
    collection: (v) => ({ field: "collection", op: "eq", value: v }),
    grade: (v) => ({ field: "grade", op: "eq", value: v }),
  },
  shape: {
    collection: z.enum(["bukhari", "muslim", "tirmidhi", "abudawud", "nasai", "ibnmajah", "malik", "ahmad"]),
    book: z.string().optional(),
    hadithNumber: z.string().min(1),
    narratorAr: z.string().optional(),
    narratorEn: z.string().optional(),
    textAr: z.string().min(1),
    textEn: z.string().min(1),
    grade: z.enum(["sahih", "hasan", "daif", "sahih-bukhari", "sahih-muslim"]).optional(),
    source: z.string().optional(),
    tags: z.array(z.string()).optional(),
  },
});

export const GET = handlers.list;
export const POST = handlers.create;
