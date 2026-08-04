/**
 * GET/PATCH/DELETE /api/admin/hadith/[id]
 */
import { makeCrudHandlers } from "@/lib/admin/crud-factory";

const handlers = makeCrudHandlers({
  collection: "hadiths",
  auditPrefix: "hadith",
  sort: "collection:asc,hadithNumber:asc",
  searchableFields: ["textEn", "textAr"],
  shape: {},
});

export const GET = handlers.get;
export const PATCH = handlers.update;
export const DELETE = handlers.remove;
