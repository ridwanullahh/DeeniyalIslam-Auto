import { makeCrudHandlers } from "@/lib/admin/crud-factory";

const handlers = makeCrudHandlers({
  collection: "reminders",
  auditPrefix: "reminder",
  searchableFields: ["title", "body"],
  shape: {},
});

export const GET = handlers.get;
export const PATCH = handlers.update;
export const DELETE = handlers.remove;
