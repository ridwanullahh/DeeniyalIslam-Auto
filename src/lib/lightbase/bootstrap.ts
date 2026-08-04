/**
 * Idempotent collection bootstrapper.
 * Creates any missing collections in the configured Lightbase project.
 * Safe to run multiple times — existing collections are skipped (409).
 */
import {
  createCollection,
  listCollections,
  ensureBucket,
  lb,
  LightbaseError,
} from "./client";
import { ALL_SCHEMAS, COLLECTION_NAMES } from "./schemas";
import { CONFIG } from "@/config";
import { logger } from "@/lib/logger";

const log = logger("lightbase:bootstrap");

export interface BootstrapResult {
  created: string[];
  skipped: string[];
  errors: Array<{ collection: string; error: string }>;
  bucket: { name: string; ok: boolean; error?: string };
  healthy: boolean;
}

export async function bootstrap(): Promise<BootstrapResult> {
  log.info("Starting Lightbase bootstrap…");

  // 1. Verify health
  const health = await lb.health().catch((e) => {
    log.error({ err: e }, "Lightbase health check failed");
    return null;
  });
  if (!health || health.status !== "ok") {
    return {
      created: [],
      skipped: [],
      errors: [],
      bucket: { name: CONFIG.lightbase.bucket, ok: false, error: "Lightbase unhealthy" },
      healthy: false,
    };
  }
  log.info({ status: health.status, version: health.version }, "Lightbase healthy");

  // 2. List existing collections
  const existing = await listCollections();
  const existingNames = new Set(existing.map((c) => c.name));
  log.info({ existing: Array.from(existingNames) }, "Existing collections");

  // 3. Create missing collections
  const created: string[] = [];
  const skipped: string[] = [];
  const errors: Array<{ collection: string; error: string }> = [];

  for (const schema of ALL_SCHEMAS) {
    if (existingNames.has(schema.name)) {
      skipped.push(schema.name);
      continue;
    }
    try {
      await createCollection(schema.name, schema.fields, schema.indexes);
      created.push(schema.name);
      log.info({ collection: schema.name }, "Collection created");
    } catch (e) {
      const msg = e instanceof LightbaseError ? `${e.code}: ${e.message}` : String(e);
      // 409 means it already exists; treat as skipped
      if (e instanceof LightbaseError && e.status === 409) {
        skipped.push(schema.name);
      } else {
        errors.push({ collection: schema.name, error: msg });
        log.error({ collection: schema.name, err: e }, "Failed to create collection");
      }
    }
  }

  // 4. Ensure media bucket
  let bucketOk = true;
  let bucketError: string | undefined;
  try {
    await ensureBucket(CONFIG.lightbase.bucket, { public: true });
    log.info({ bucket: CONFIG.lightbase.bucket }, "Media bucket ready");
  } catch (e) {
    bucketOk = false;
    bucketError = e instanceof Error ? e.message : String(e);
    log.error({ err: e }, "Failed to ensure bucket");
  }

  return {
    created,
    skipped,
    errors,
    bucket: { name: CONFIG.lightbase.bucket, ok: bucketOk, error: bucketError },
    healthy: errors.length === 0 && bucketOk,
  };
}

export { COLLECTION_NAMES };
