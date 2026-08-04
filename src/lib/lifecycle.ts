/**
 * Lifecycle hook — runs once when the Astro server starts.
 * Starts the scheduler + WhatsApp bot in-process (if enabled).
 */
import { CONFIG } from "@/config";
import { logger } from "@/lib/logger";

const log = logger("lifecycle");

let started = false;

export async function ensureBackgroundWorkers(): Promise<void> {
  if (started) return;
  started = true;

  if (CONFIG.scheduler.enabled) {
    try {
      const { startScheduler } = await import("@/lib/scheduler/engine");
      startScheduler();
      log.info("Scheduler started");
    } catch (e) {
      log.error({ err: e }, "Failed to start scheduler");
    }
  }

  if (CONFIG.whatsapp.enabled) {
    try {
      const { connect } = await import("@/lib/channels/whatsapp/bailey");
      // Connect in background — don't await; if it fails, the adapter will
      // report disconnected and we can retry from the admin UI.
      connect().catch((e) => log.error({ err: e }, "WhatsApp connect failed"));
      log.info("WhatsApp adapter starting");
    } catch (e) {
      log.error({ err: e }, "Failed to start WhatsApp adapter");
    }
  }
}
