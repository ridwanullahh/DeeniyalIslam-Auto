/**
 * GET /api/admin/whatsapp-qr
 * Returns the current WhatsApp pairing QR code as a PNG image (or 404 if no QR
 * is currently available).
 */
import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import QRCode from "qrcode";
import { getCurrentQr } from "@/lib/channels/whatsapp/bailey";

export const GET: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;

  const qr = getCurrentQr();
  if (!qr) {
    return new Response(JSON.stringify({ ok: false, error: "No QR available" }), {
      status: 404, headers: { "Content-Type": "application/json" },
    });
  }
  try {
    const png = await QRCode.toBuffer(qr, {
      width: 320,
      margin: 2,
      color: { dark: "#181F25", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    });
    return new Response(png, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
};
