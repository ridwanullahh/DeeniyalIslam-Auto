/**
 * Audit log writer. Records admin actions to the `admin_audit` collection.
 */
import { collections } from "@/lib/lightbase/client";
import { logger } from "@/lib/logger";

const log = logger("audit");
const audit = collections("admin_audit");

export interface AuditEntry {
  actor: string;
  action: string;
  target?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
  userAgent?: string;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await audit.insert({
      actor: entry.actor,
      action: entry.action,
      target: entry.target ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
      at: new Date().toISOString(),
      ip: entry.ip ?? null,
      userAgent: entry.userAgent ?? null,
    });
  } catch (e) {
    // Audit logging must never break the actual operation.
    log.error({ err: e, entry }, "Failed to write audit entry");
  }
}
