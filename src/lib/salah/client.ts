/**
 * Aladhan API client — fetches salah times by city or lat/lng.
 * Free API, no key required. Docs: https://aladhan.com/prayer-times-api
 *
 * Bismillah Ar-Rahman Ar-Raheem.
 */
import { CONFIG } from "@/config";
import { logger } from "@/lib/logger";
import { collections } from "@/lib/lightbase/client";

const log = logger("salah:client");

const salahSchedules = collections("salah_schedules");
const subscribers = collections("subscribers");

export interface SalahTimes {
  date: string; // YYYY-MM-DD (subscriber's local date)
  timezone: string;
  latitude?: number;
  longitude?: number;
  method: number;
  fajr: string;   // UTC ISO datetime
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  fetchedAt: string;
}

interface AladhanTimingsResponse {
  code: number;
  status: string;
  data: {
    timings: {
      Fajr: string;
      Sunrise: string;
      Dhuhr: string;
      Asr: string;
      Maghrib: string;
      Isha: string;
    };
    date: {
      readable: string;
      gregorian: { date: string; weekday: { en: string } };
      hijri: { date: string; month: { en: string; ar: string }; year: string };
    };
    meta: {
      latitude: number;
      longitude: number;
      timezone: string;
      method: { id: number; name: string };
    };
  };
}

/**
 * Fetch salah times for a given lat/lng + date from the Aladhan API.
 * Returns times in UTC (converted from the API's local time using the meta timezone).
 */
export async function fetchSalahTimesByCoords(
  lat: number,
  lng: number,
  dateLocal: string, // YYYY-MM-DD in the subscriber's tz
  method: number = CONFIG.salah.method,
  school: number = CONFIG.salah.school,
): Promise<SalahTimes | null> {
  const url = new URL(`${CONFIG.salah.apiBase}/timings/${dateLocal}`);
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lng));
  url.searchParams.set("method", String(method));
  url.searchParams.set("school", String(school));

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      log.warn({ status: res.status, lat, lng, dateLocal }, "Aladhan API returned non-200");
      return null;
    }
    const json = (await res.json()) as AladhanTimingsResponse;
    if (json.code !== 200) {
      log.warn({ code: json.code, status: json.status }, "Aladhan API error");
      return null;
    }
    const tz = json.data.meta.timezone || "UTC";
    return {
      date: dateLocal,
      timezone: tz,
      latitude: json.data.meta.latitude,
      longitude: json.data.meta.longitude,
      method: json.data.meta.method.id,
      fajr: localToUtc(json.data.timings.Fajr, dateLocal, tz),
      sunrise: localToUtc(json.data.timings.Sunrise, dateLocal, tz),
      dhuhr: localToUtc(json.data.timings.Dhuhr, dateLocal, tz),
      asr: localToUtc(json.data.timings.Asr, dateLocal, tz),
      maghrib: localToUtc(json.data.timings.Maghrib, dateLocal, tz),
      isha: localToUtc(json.data.timings.Isha, dateLocal, tz),
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    log.error({ err: e, lat, lng, dateLocal }, "Aladhan fetch failed");
    return null;
  }
}

/**
 * Fetch salah times by city name (uses Aladhan's timingsByCity endpoint).
 * Falls back to lat/lng if available.
 */
export async function fetchSalahTimesByCity(
  city: string,
  country: string,
  dateLocal: string,
  method: number = CONFIG.salah.method,
  school: number = CONFIG.salah.school,
): Promise<SalahTimes | null> {
  const url = new URL(`${CONFIG.salah.apiBase}/timingsByCity/${dateLocal}`);
  url.searchParams.set("city", city);
  url.searchParams.set("country", country);
  url.searchParams.set("method", String(method));
  url.searchParams.set("school", String(school));

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as AladhanTimingsResponse;
    if (json.code !== 200) return null;
    const tz = json.data.meta.timezone || "UTC";
    return {
      date: dateLocal,
      timezone: tz,
      latitude: json.data.meta.latitude,
      longitude: json.data.meta.longitude,
      method: json.data.meta.method.id,
      fajr: localToUtc(json.data.timings.Fajr, dateLocal, tz),
      sunrise: localToUtc(json.data.timings.Sunrise, dateLocal, tz),
      dhuhr: localToUtc(json.data.timings.Dhuhr, dateLocal, tz),
      asr: localToUtc(json.data.timings.Asr, dateLocal, tz),
      maghrib: localToUtc(json.data.timings.Maghrib, dateLocal, tz),
      isha: localToUtc(json.data.timings.Isha, dateLocal, tz),
      fetchedAt: new Date().toISOString(),
    };
  } catch (e) {
    log.error({ err: e, city, country, dateLocal }, "Aladhan city fetch failed");
    return null;
  }
}

/**
 * Convert a "HH:MM" or "HH:MM (TZ)" time string (Aladhan format) to UTC ISO.
 * Aladhan returns times like "05:13 (WAT)" — we parse the HH:MM and combine
 * with the date + timezone to get a UTC instant.
 *
 * Algorithm: We do a binary search over possible UTC instants near the local
 * wall-clock time. For each candidate UTC instant, we format it in the target
 * timezone and check if the resulting wall-clock matches our target. This is
 * the only correct way to do tz-aware conversion without depending on a tz
 * database library like luxon.
 */
function localToUtc(timeStr: string, dateLocal: string, timezone: string): string {
  // Strip parenthetical tz, take just HH:MM
  const cleanTime = timeStr.replace(/\s*\(.*\)/, "").trim();
  const [h, m] = cleanTime.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return new Date(dateLocal + "T00:00:00Z").toISOString();
  }
  const targetHh = String(h).padStart(2, "0");
  const targetMm = String(m).padStart(2, "0");
  const targetWallClock = `${targetHh}:${targetMm}`; // "HH:MM"

  // Naive UTC instant built from local date+time (treats local as UTC)
  // — this is the wrong answer but a good starting point for the search.
  const naiveUtc = new Date(`${dateLocal}T${targetHh}:${targetMm}:00Z`);

  // Search ±14 hours around the naive UTC for the instant that, when formatted
  // in the target tz, yields the same HH:MM wall-clock.
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  for (let offsetMin = -14 * 60; offsetMin <= 14 * 60; offsetMin++) {
    const candidate = new Date(naiveUtc.getTime() - offsetMin * 60_000);
    // Format the candidate in the target tz
    const formatted = formatter.format(candidate); // "HH:MM"
    if (formatted === targetWallClock) {
      return candidate.toISOString();
    }
  }
  // Fallback: use the naive UTC (will be off by the tz offset, but at least valid)
  return naiveUtc.toISOString();
}

/**
 * Get or fetch today's salah times for a subscriber.
 * Tries the cache first; if missing or stale, fetches from Aladhan.
 *
 * Subscriber must have lat/lng in their `meta` field, OR a city/country in meta.
 * If neither is set, we cannot compute salah times.
 */
export async function getSalahTimesForSubscriber(subscriberId: string): Promise<SalahTimes | null> {
  // Determine subscriber's local date (today in their tz)
  let subscriber: any;
  try {
    subscriber = await subscribers.get(subscriberId);
  } catch {
    return null;
  }
  if (!subscriber) return null;
  const tz = subscriber.timezone || "UTC";
  const dateLocal = todayInTz(tz);

  // Check cache
  try {
    const cached = await salahSchedules.list({
      filter: { and: [
        { field: "subscriberId", op: "eq", value: subscriberId },
        { field: "date", op: "eq", value: dateLocal },
      ] },
      limit: 1,
    });
    if (cached.data.length > 0) {
      const c = cached.data[0] as any;
      return {
        date: c.date,
        timezone: c.timezone,
        latitude: c.latitude,
        longitude: c.longitude,
        method: c.method,
        fajr: c.fajr,
        sunrise: c.sunrise,
        dhuhr: c.dhuhr,
        asr: c.asr,
        maghrib: c.maghrib,
        isha: c.isha,
        fetchedAt: c.fetchedAt,
      };
    }
  } catch (e) {
    log.warn({ err: e, subscriberId }, "Failed to read cached salah times");
  }

  // Fetch fresh
  const meta = subscriber.meta || {};
  let times: SalahTimes | null = null;
  if (typeof meta.latitude === "number" && typeof meta.longitude === "number") {
    times = await fetchSalahTimesByCoords(meta.latitude, meta.longitude, dateLocal);
  } else if (meta.city && meta.country) {
    times = await fetchSalahTimesByCity(meta.city, meta.country, dateLocal);
  } else {
    // No location set — we can't compute salah times for this subscriber
    log.info({ subscriberId }, "Subscriber has no location; cannot fetch salah times");
    return null;
  }
  if (!times) return null;

  // Cache it (upsert by subscriberId + date unique)
  try {
    await salahSchedules.upsert(
      { and: [
        { field: "subscriberId", op: "eq", value: subscriberId },
        { field: "date", op: "eq", value: dateLocal },
      ] },
      {
        subscriberId,
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
    log.warn({ err: e, subscriberId }, "Failed to cache salah times");
  }
  return times;
}

/** Returns YYYY-MM-DD for "today" in the given IANA timezone. */
export function todayInTz(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  // en-CA gives YYYY-MM-DD format natively
  return formatter.format(now);
}
