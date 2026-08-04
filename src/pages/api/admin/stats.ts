/**
 * GET /api/admin/stats
 * Returns dashboard stats: subscriber count, content counts, post counts,
 * delivery stats, recent audit entries, upcoming scheduled posts.
 *
 * Admin-only.
 */
import type { APIRoute } from "astro";
import { requireAdmin } from "@/lib/auth/requireAdmin";
import { collections } from "@/lib/lightbase/client";
import { logger } from "@/lib/logger";

const log = logger("api:admin:stats");

export const GET: APIRoute = async (ctx) => {
  const admin = await requireAdmin(ctx, { api: true });
  if (admin instanceof Response) return admin;

  try {
    const subscribers = collections("subscribers");
    const subscriptions = collections("subscriptions");
    const quran = collections("quran_verses");
    const hadiths = collections("hadiths");
    const adhkar = collections("adhkar");
    const reminders = collections("reminders");
    const posts = collections("posts");
    const delivery = collections("delivery_log");
    const audit = collections("admin_audit");

    // Fetch counts in parallel — use list with count=true, limit=1 to get total
    const [
      subsList, subList, quranList, hadithList, adhkarList, remList,
      postsList, schedList, deliveredList, failedList, recentAudit,
    ] = await Promise.all([
      subscribers.list({ count: true, limit: 1 }),
      subscriptions.list({ count: true, limit: 1 }),
      quran.list({ count: true, limit: 1 }),
      hadiths.list({ count: true, limit: 1 }),
      adhkar.list({ count: true, limit: 1 }),
      reminders.list({ count: true, limit: 1 }),
      posts.list({ count: true, limit: 1, filter: { field: "status", op: "eq", value: "published" } }),
      posts.list({ limit: 10, sort: "scheduledFor:asc", filter: { field: "status", op: "eq", value: "scheduled" } }),
      delivery.list({ count: true, limit: 1, filter: { field: "status", op: "eq", value: "sent" } }),
      delivery.list({ count: true, limit: 1, filter: { field: "status", op: "eq", value: "failed" } }),
      audit.list({ limit: 20, sort: "at:desc" }),
    ]);

    const totalSubs = subsList.count ?? subsList.data.length;
    const totalSubsSubs = subList.count ?? subList.data.length;
    const totalQuran = quranList.count ?? quranList.data.length;
    const totalHadith = hadithList.count ?? hadithList.data.length;
    const totalAdhkar = adhkarList.count ?? adhkarList.data.length;
    const totalReminders = remList.count ?? remList.data.length;
    const totalPublishedPosts = postsList.count ?? postsList.data.length;
    const totalDelivered = deliveredList.count ?? 0;
    const totalFailed = failedList.count ?? 0;
    const deliveryRate = totalDelivered + totalFailed > 0
      ? Math.round((totalDelivered / (totalDelivered + totalFailed)) * 100)
      : 100;

    return new Response(JSON.stringify({
      ok: true,
      stats: {
        subscribers: totalSubs,
        subscriptions: totalSubsSubs,
        content: {
          quran_verses: totalQuran,
          hadiths: totalHadith,
          adhkar: totalAdhkar,
          reminders: totalReminders,
        },
        published_posts: totalPublishedPosts,
        delivery: {
          sent: totalDelivered,
          failed: totalFailed,
          rate: deliveryRate,
        },
      },
      scheduled: schedList.data.map((p: any) => ({
        id: p.id,
        contentType: p.contentType,
        scheduledFor: p.scheduledFor,
        status: p.status,
        channelTargets: p.channelTargets,
      })),
      recentAudit: recentAudit.data.map((a: any) => ({
        id: a.id,
        actor: a.actor,
        action: a.action,
        target: a.target,
        at: a.at,
      })),
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error({ err: e }, "Stats fetch failed");
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Stats fetch failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
