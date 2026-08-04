/**
 * Cloudinary integration — for the full Real Mushaf Library media storage.
 *
 * When CLOUDINARY_ENABLED=true, uploads + signed URLs go through Cloudinary.
 * When false, the platform falls back to Lightbase storage (which we already
 * have wired up in src/lib/lightbase/client.ts).
 *
 * Bismillah Ar-Rahman Ar-Raheem.
 */
import { CONFIG } from "@/config";
import { logger } from "@/lib/logger";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const log = logger("cloudinary");

function isEnabled(): boolean {
  return CONFIG.cloudinary.enabled
    && !!CONFIG.cloudinary.cloudName
    && !!CONFIG.cloudinary.apiKey
    && !!CONFIG.cloudinary.apiSecret;
}

/**
 * Generate a Cloudinary signature for unsigned uploads.
 * Used by the admin UI for direct-to-Cloudinary uploads.
 */
export function generateUploadSignature(folder: string): {
  api_key: string;
  timestamp: number;
  signature: string;
  cloud_name: string;
  folder: string;
  enabled: boolean;
} | null {
  if (!isEnabled()) return null;
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = crypto
    .createHmac("sha1", CONFIG.cloudinary.apiSecret)
    .update(paramsToSign)
    .digest("hex");
  return {
    api_key: CONFIG.cloudinary.apiKey,
    timestamp,
    signature,
    cloud_name: CONFIG.cloudinary.cloudName,
    folder,
    enabled: true,
  };
}

/**
 * Get the public URL of a Cloudinary resource (with optional transformations).
 * Cloudinary URLs are public by default; for private resources, use signed URLs.
 */
export function publicUrl(publicId: string, opts: { width?: number; height?: number; format?: string } = {}): string {
  const cloud = CONFIG.cloudinary.cloudName;
  const transforms: string[] = [];
  if (opts.width) transforms.push(`w_${opts.width}`);
  if (opts.height) transforms.push(`h_${opts.height}`);
  if (opts.format) transforms.push(`f_${opts.format}`);
  const transformStr = transforms.length > 0 ? transforms.join(",") + "/" : "";
  return `https://res.cloudinary.com/${cloud}/image/upload/${transformStr}${publicId}`;
}

/**
 * Generate a signed URL for a private Cloudinary resource.
 * Valid for `expiresIn` seconds (default 1 hour).
 */
export function signedUrl(publicId: string, expiresIn: number = 3600): string {
  if (!isEnabled()) return publicUrl(publicId);
  const cloud = CONFIG.cloudinary.cloudName;
  const timestamp = Math.floor(Date.now() / 1000) + expiresIn;
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHmac("sha1", CONFIG.cloudinary.apiSecret)
    .update(paramsToSign)
    .digest("hex");
  return `https://res.cloudinary.com/${cloud}/image/upload/sign_url?public_id=${publicId}&timestamp=${timestamp}&signature=${signature}&api_key=${CONFIG.cloudinary.apiKey}`;
}

/**
 * Upload a file buffer to Cloudinary. Returns the public_id + URL.
 * Used by the admin Mushaf upload flow.
 */
export async function uploadBuffer(
  buffer: Buffer,
  publicId: string,
  folder: string = CONFIG.cloudinary.mushafFolder,
  contentType: string = "image/png",
): Promise<{ publicId: string; url: string; secureUrl: string } | null> {
  if (!isEnabled()) {
    log.warn("Cloudinary not enabled; upload skipped");
    return null;
  }
  // Cloudinary's upload API accepts multipart/form-data.
  // We construct it manually to avoid pulling in formidable/form-data.
  const boundary = `----di${Date.now()}${Math.random().toString(36).slice(2)}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHmac("sha1", CONFIG.cloudinary.apiSecret)
    .update(paramsToSign)
    .digest("hex");

  const ext = contentType.split("/")[1] || "png";
  const filename = `${publicId}.${ext}`;
  const parts: Buffer[] = [];

  function addField(name: string, value: string) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`));
  }

  addField("folder", folder);
  addField("public_id", publicId);
  addField("timestamp", String(timestamp));
  addField("api_key", CONFIG.cloudinary.apiKey);
  addField("signature", signature);

  parts.push(Buffer.from(
    `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`,
  ));
  parts.push(buffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/image/upload`, {
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(body.length),
      },
      body,
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      const text = await res.text();
      log.error({ status: res.status, body: text.slice(0, 500) }, "Cloudinary upload failed");
      return null;
    }
    const data = (await res.json()) as {
      public_id: string;
      secure_url: string;
      url: string;
      width: number;
      height: number;
      bytes: number;
    };
    return {
      publicId: data.public_id,
      url: data.url,
      secureUrl: data.secure_url,
    };
  } catch (e) {
    log.error({ err: e }, "Cloudinary upload error");
    return null;
  }
}

/**
 * Delete a Cloudinary resource by public_id.
 */
export async function deleteResource(publicId: string): Promise<boolean> {
  if (!isEnabled()) return false;
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
  const signature = crypto
    .createHmac("sha1", CONFIG.cloudinary.apiSecret)
    .update(paramsToSign)
    .digest("hex");

  try {
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CONFIG.cloudinary.cloudName}/resources/image/upload`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        public_id: publicId,
        timestamp,
        api_key: CONFIG.cloudinary.apiKey,
        signature,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    return res.ok;
  } catch (e) {
    log.error({ err: e, publicId }, "Cloudinary delete failed");
    return false;
  }
}

export function isCloudinaryEnabled(): boolean {
  return isEnabled();
}

/**
 * Get a config snapshot for the admin UI (no secrets).
 */
export function getConfigSnapshot() {
  return {
    enabled: isEnabled(),
    cloudName: CONFIG.cloudinary.cloudName,
    apiKey: CONFIG.cloudinary.apiKey ? CONFIG.cloudinary.apiKey.slice(0, 4) + "…" : "",
    mushafFolder: CONFIG.cloudinary.mushafFolder,
  };
}
