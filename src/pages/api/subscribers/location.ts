/**
 * POST /api/subscribers/location
 * Public endpoint to set a subscriber's location (city, country) + auto-detect timezone
 * from Aladhan API. Used by the khatma subscribe flow.
 *
 * Body: { platform, handle, city, country }
 */
import type { APIRoute } from "astro";
import { collections } from "@/lib/lightbase/client";
import { fetchSalahTimesByCity, todayInTz } from "@/lib/salah/client";

const subscribers = collections("subscribers");
const salahSchedules = collections("salah_schedules");

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: any;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const { platform, handle, city, country } = body;
  if (!platform || !handle || !city || !country) {
    return new Response(JSON.stringify({ ok: false, error: "platform, handle, city, country are required" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  // Find the subscriber
  const list = await subscribers.list({
    filter: { and: [
      { field: "platform", op: "eq", value: platform },
      { field: "handle", op: "eq", value: handle },
    ] },
    limit: 1,
  });
  if (list.data.length === 0) {
    return new Response(JSON.stringify({ ok: false, error: "Subscriber not found. Please subscribe first." }), {
      status: 404, headers: { "Content-Type": "application/json" },
    });
  }
  const sub = list.data[0];

  // Compute salah times to verify + cache lat/lng + tz
  const dateLocal = todayInTz(sub.timezone || "UTC");
  const times = await fetchSalahTimesByCity(city, country, dateLocal);
  if (!times) {
    return new Response(JSON.stringify({ ok: false, error: `Could not find salah times for "${city}, ${country}". Please check the spelling.` }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  // Update subscriber with location + timezone
  await subscribers.update(sub.id, {
    timezone: times.timezone,
    lastSeenAt: new Date().toISOString(),
    meta: {
      ...((sub.meta as any) ?? {}),
      city,
      country,
      latitude: times.latitude,
      longitude: times.longitude,
      method: times.method,
    },
  });

  // ALSO upsert the salah_schedules cache so the scheduler + subscribe endpoint
  // see the fresh times (not stale cached values from a previous conversion).
  try {
    await salahSchedules.upsert(
      { and: [
        { field: "subscriberId", op: "eq", value: sub.id },
        { field: "date", op: "eq", value: dateLocal },
      ] },
      {
        subscriberId: sub.id,
        date: dateLocal,
        timezone: times.timezone,
        latitude: times.latitude ?? null,
        longitude: times.longitude ?? null,
        method: times.method,
        fajr: times.fajr,
        sunrise: times.sunrise,
        dhuhr: times.dhuhr,
        asr: times.asr,
        maghrib: times.maghrib,
        isha: times.isha,
        fetchedAt: times.fetchedAt,
      },
    );
  } catch (e) {
    // Non-fatal — the scheduler will re-fetch if needed
  }

  return new Response(JSON.stringify({
    ok: true,
    subscriberId: sub.id,
    timezone: times.timezone,
    salahTimes: {
      fajr: times.fajr,
      dhuhr: times.dhuhr,
      asr: times.asr,
      maghrib: times.maghrib,
      isha: times.isha,
    },
  }), { status: 200, headers: { "Content-Type": "application/json" } });
};
