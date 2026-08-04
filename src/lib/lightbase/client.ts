/**
 * Lightbase REST client — typed fetch wrapper around the Lightbase BaaS API.
 * Handles auth headers, JSON envelope, error normalization, retries.
 *
 * Docs: see "Lightbase API Docs" file in repo root.
 */
import { CONFIG } from "@/config";
import { logger } from "@/lib/logger";

const log = logger("lightbase:client");

export class LightbaseError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly correlationId?: string,
  ) {
    super(message);
    this.name = "LightbaseError";
  }
}

interface LightbaseResponse<T> {
  data?: T;
  error?: {
    code: string;
    domain?: string;
    message: string;
    details?: unknown;
    method?: string;
    path?: string;
  };
  correlationId?: string;
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const base = CONFIG.lightbase.baseUrl;
  const url = new URL(`${base}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null) continue;
      if (typeof v === "object") {
        url.searchParams.set(k, JSON.stringify(v));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: CONFIG.lightbase.apiKey,
    "x-lightbase-project": CONFIG.lightbase.projectId,
    ...extra,
  };
}

async function request<T>(
  method: string,
  path: string,
  opts: {
    body?: unknown;
    params?: Record<string, unknown>;
    headers?: Record<string, string>;
    timeoutMs?: number;
    expect?: "json" | "text" | "arrayBuffer";
  } = {},
): Promise<T> {
  const url = buildUrl(path, opts.params);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30_000);
  try {
    const res = await fetch(url, {
      method,
      headers: {
        ...authHeaders(opts.headers),
        // Lightbase requires Content-Type: application/json on all
        // state-changing requests (incl. DELETE) to bypass CSRF protection.
        "Content-Type": "application/json",
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
    const expect = opts.expect ?? "json";
    if (expect === "arrayBuffer") {
      if (!res.ok) {
        throw new LightbaseError(res.status, "http_error", `Lightbase ${method} ${path} failed: ${res.status}`);
      }
      return (await res.arrayBuffer()) as unknown as T;
    }
    const raw = expect === "text" ? await res.text() : await res.text();
    let parsed: LightbaseResponse<T> | null = null;
    try {
      parsed = raw ? (JSON.parse(raw) as LightbaseResponse<T>) : null;
    } catch {
      // non-JSON response
      if (!res.ok) {
        throw new LightbaseError(res.status, "http_error", `Lightbase ${method} ${path} returned ${res.status}: ${raw.slice(0, 200)}`);
      }
      return raw as unknown as T;
    }

    if (!res.ok) {
      const err = parsed?.error;
      throw new LightbaseError(
        res.status,
        err?.code ?? "http_error",
        err?.message ?? `Lightbase ${method} ${path} failed: ${res.status}`,
        err?.details,
        parsed?.correlationId,
      );
    }
    // The REST API returns the data envelope directly inside `data` for most
    // endpoints, but for insert/get the document is at `parsed.document`.
    // We return the whole parsed body and let callers extract the field they need.
    return (parsed as unknown) as T;
  } finally {
    clearTimeout(timeout);
  }
}

export const lb = {
  /** GET a path, returning parsed JSON */
  get: <T = unknown>(path: string, params?: Record<string, unknown>) =>
    request<T>("GET", path, { params }),
  /** POST a body */
  post: <T = unknown>(path: string, body?: unknown, opts?: { params?: Record<string, unknown>; headers?: Record<string, string> }) =>
    request<T>("POST", path, { body, params: opts?.params, headers: opts?.headers }),
  /** PUT a body */
  put: <T = unknown>(path: string, body?: unknown) =>
    request<T>("PUT", path, { body }),
  /** PATCH a body */
  patch: <T = unknown>(path: string, body: unknown, headers?: Record<string, string>) =>
    request<T>("PATCH", path, { body, headers }),
  /** DELETE */
  delete: <T = unknown>(path: string) => request<T>("DELETE", path),

  /** Health check — unauthenticated */
  health: async () => {
    const r = await fetch(`${CONFIG.lightbase.baseUrl}/health`, { method: "GET" });
    return (await r.json()) as { status: string; version: string; timestamp: string };
  },
};

// ---------------------------------------------------------------------------
// Collection helpers — typed wrappers around the document CRUD endpoints
// ---------------------------------------------------------------------------

export interface LightbaseDoc<T = Record<string, unknown>> {
  id: string;
  _created_at: string;
  _updated_at: string;
  _revision: number;
  _deleted: boolean;
  _checksum: string;
}

export interface ListResponse<T> {
  data: (T & LightbaseDoc)[];
  nextCursor?: { limit: number; offset: number } | null;
  total?: number;
  hasMore?: boolean;
  count?: number;
}

export type FilterExpr =
  | { field: string; op: string; value: unknown }
  | { and: FilterExpr[] }
  | { or: FilterExpr[] };

export interface QueryOpts {
  filter?: FilterExpr;
  sort?: string; // e.g. "createdAt:desc"
  limit?: number;
  after?: string;
  cursor?: { limit: number; offset: number };
  count?: boolean;
  select?: string;
}

export function collections(name: string) {
  const base = `/api/v1/projects/${CONFIG.lightbase.projectId}/collections/${name}`;
  return {
    /** Insert a document */
    insert: async <T = Record<string, unknown>>(doc: T) => {
      const r = await lb.post<{ document: T & LightbaseDoc }>(base, doc);
      return r.document;
    },

    /** Get a document by ID */
    get: async <T = Record<string, unknown>>(id: string) => {
      const r = await lb.get<{ document: T & LightbaseDoc }>(`${base}/${id}`);
      return r.document;
    },

    /** Update a document by ID (full replace of provided fields) */
    update: async <T = Record<string, unknown>>(id: string, patch: Partial<T>, revision?: number) => {
      const headers: Record<string, string> = {};
      if (revision !== undefined) headers["If-Match"] = String(revision);
      const r = await lb.patch<{ document: T & LightbaseDoc }>(`${base}/${id}`, patch, headers);
      return r.document;
    },

    /** Delete a document by ID */
    delete: async (id: string) => {
      await lb.delete(`${base}/${id}`);
      return true;
    },

    /** Query documents with filter/sort/limit/pagination */
    list: async <T = Record<string, unknown>>(opts: QueryOpts = {}): Promise<ListResponse<T>> => {
      const params: Record<string, unknown> = {};
      if (opts.filter) params.filter = opts.filter;
      if (opts.sort) params.sort = opts.sort;
      if (opts.limit !== undefined) params.limit = opts.limit;
      if (opts.after) params.after = opts.after;
      if (opts.cursor) params.cursor = opts.cursor;
      if (opts.count) params.count = true;
      if (opts.select) params.select = opts.select;
      return await lb.get<ListResponse<T>>(`${base}/docs`, params);
    },

    /** Upsert by filter */
    upsert: async <T = Record<string, unknown>>(filter: FilterExpr, document: T) => {
      const r = await lb.put<{ document: T & LightbaseDoc; created: boolean }>(`${base}/upsert`, {
        filter,
        document,
      });
      return r;
    },

    /** Bulk insert via /seed endpoint (dedup support) */
    seed: async <T = Record<string, unknown>>(documents: T[], dedupOn: string[] = []) => {
      const r = await lb.post<{ inserted: number; skipped: number; errors: unknown[] }>(
        `/api/v1/projects/${CONFIG.lightbase.projectId}/seed`,
        { collection: name, documents, dedupOn },
      );
      return r;
    },
  };
}

/** Create a collection with a schema */
export async function createCollection(name: string, fields: unknown[], indexes?: unknown[]) {
  return await lb.post<{ collection: { name: string; revision: number } }>(
    `/api/v1/projects/${CONFIG.lightbase.projectId}/collections`,
    { name, fields, indexes },
  );
}

/** List all collections in the project */
export async function listCollections() {
  const r = await lb.get<{ collections: { name: string; revision?: number }[] }>(
    `/api/v1/projects/${CONFIG.lightbase.projectId}/collections`,
  );
  return r.collections ?? [];
}

/** Get a collection schema */
export async function getCollection(name: string) {
  return await lb.get<{ collection: { name: string; fields: unknown[]; revision: number } }>(
    `/api/v1/projects/${CONFIG.lightbase.projectId}/collections/${name}`,
  );
}

/** Delete a collection */
export async function deleteCollection(name: string) {
  await lb.delete(`/api/v1/projects/${CONFIG.lightbase.projectId}/collections/${name}`);
  return true;
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

export async function ensureBucket(name: string, opts: { public?: boolean; allowedMimeTypes?: string[] } = {}) {
  try {
    return await lb.post(`/api/v1/projects/${CONFIG.lightbase.projectId}/storage/buckets`, {
      name,
      public: opts.public ?? true,
      allowedMimeTypes: opts.allowedMimeTypes ?? ["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"],
    });
  } catch (e) {
    if (e instanceof LightbaseError && e.status === 409) {
      // bucket already exists — fine
      return { alreadyExists: true };
    }
    throw e;
  }
}

export async function uploadFile(bucket: string, path: string, body: Buffer | ArrayBuffer | string, contentType: string) {
  const r = await lb.post(
    `/api/v1/projects/${CONFIG.lightbase.projectId}/storage/${bucket}/upload?path=${encodeURIComponent(path)}`,
    body,
    { headers: { "Content-Type": contentType } },
  );
  return r;
}

export async function signedUrl(bucket: string, path: string, expiresIn = 3600) {
  const r = await lb.post<{ url: string; expiresAt: string }>(
    `/api/v1/projects/${CONFIG.lightbase.projectId}/storage/${bucket}/signed-url`,
    { path, expiresIn },
  );
  return r;
}

export function publicFileUrl(bucket: string, path: string): string {
  return `${CONFIG.lightbase.baseUrl}/api/v1/projects/${CONFIG.lightbase.projectId}/storage/${bucket}/download?path=${encodeURIComponent(path)}`;
}

// ---------------------------------------------------------------------------
// Self-test — called from the bootstrap script and from a /api/_health route
// ---------------------------------------------------------------------------

export async function selfTest(): Promise<{ healthy: boolean; collectionsCount: number; error?: string }> {
  try {
    const health = await lb.health();
    if (health.status !== "ok") {
      return { healthy: false, collectionsCount: 0, error: `Health status: ${health.status}` };
    }
    const list = await listCollections();
    return { healthy: true, collectionsCount: list.length };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log.error({ err: e }, "Lightbase self-test failed");
    return { healthy: false, collectionsCount: 0, error: msg };
  }
}
