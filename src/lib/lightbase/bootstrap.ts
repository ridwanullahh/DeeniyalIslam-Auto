/**
 * Idempotent collection bootstrapper.
 * Creates any missing collections in the configured Lightbase project, AND
 * migrates existing schemas to add new fields (via PUT /collections/:name).
 * Safe to run multiple times.
 */
import {
  createCollection,
  listCollections,
  ensureBucket,
  lb,
  LightbaseError,
} from "./client";
import { ALL_SCHEMAS, COLLECTION_NAMES, type CollectionSchema } from "./schemas";
import { CONFIG } from "@/config";
import { logger } from "@/lib/logger";

const log = logger("lightbase:bootstrap");

export interface BootstrapResult {
  created: string[];
  skipped: string[];
  migrated: string[];
  errors: Array<{ collection: string; error: string }>;
  bucket: { name: string; ok: boolean; error?: string };
  healthy: boolean;
}

/**
 * Update an existing collection's schema (adds new fields; preserves data).
 * Uses PUT /api/v1/projects/:id/collections/:name (requires admin scope).
 */
async function migrateCollectionSchema(schema: CollectionSchema): Promise<{ migrated: boolean; error?: string }> {
  const url = `/api/v1/projects/${CONFIG.lightbase.projectId}/collections/${schema.name}`;
  try {
    await lb.put(url, {
      name: schema.name,
      fields: schema.fields,
      indexes: schema.indexes ?? [],
    });
    return { migrated: true };
  } catch (e) {
    if (e instanceof LightbaseError && e.status === 400 && e.message.includes("already exists")) {
      // Index already exists — fine
      return { migrated: false };
    }
    const msg = e instanceof LightbaseError ? `${e.code}: ${e.message}` : String(e);
    return { migrated: false, error: msg };
  }
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
      created: [], skipped: [], migrated: [], errors: [],
      bucket: { name: CONFIG.lightbase.bucket, ok: false, error: "Lightbase unhealthy" },
      healthy: false,
    };
  }
  log.info({ status: health.status, version: health.version }, "Lightbase healthy");

  // 2. List existing collections
  const existing = await listCollections();
  const existingNames = new Set(existing.map((c) => c.name));
  log.info({ existing: Array.from(existingNames) }, "Existing collections");

  // 3. Create missing collections + migrate existing schemas
  const created: string[] = [];
  const skipped: string[] = [];
  const migrated: string[] = [];
  const errors: Array<{ collection: string; error: string }> = [];

  for (const schema of ALL_SCHEMAS) {
    if (!existingNames.has(schema.name)) {
      try {
        await createCollection(schema.name, schema.fields, schema.indexes);
        created.push(schema.name);
        log.info({ collection: schema.name }, "Collection created");
      } catch (e) {
        const msg = e instanceof LightbaseError ? `${e.code}: ${e.message}` : String(e);
        if (e instanceof LightbaseError && e.status === 409) {
          skipped.push(schema.name);
        } else {
          errors.push({ collection: schema.name, error: msg });
          log.error({ collection: schema.name, err: e }, "Failed to create collection");
        }
      }
    } else {
      skipped.push(schema.name);
      // Try to migrate schema (add new fields). Errors here are non-fatal —
      // the existing schema will still work for old fields.
      const r = await migrateCollectionSchema(schema);
      if (r.migrated) {
        migrated.push(schema.name);
        log.info({ collection: schema.name }, "Schema migrated");
      } else if (r.error) {
        log.debug({ collection: schema.name, error: r.error }, "Schema migration skipped");
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
    migrated,
    errors,
    bucket: { name: CONFIG.lightbase.bucket, ok: bucketOk, error: bucketError },
    healthy: errors.length === 0 && bucketOk,
  };
}

export { COLLECTION_NAMES };
