import { makeCrudHandlers } from "@/lib/admin/crud-factory";

const handlers = makeCrudHandlers({
  collection: "adhkar",
  auditPrefix: "adhkar",
  searchableFields: ["arabic", "translation"],
  shape: {},
});

export const GET = handlers.get;
export const PATCH = handlers.update;
export const DELETE = handlers.remove;
