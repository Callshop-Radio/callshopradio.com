// Public schedule, proxied from the Show Manager.
//
// The manager owns the schedule truth (`/api/public/timetable`); the site never
// reads LibreTime for this again. Cached briefly so a landing strip, a navbar
// dropdown and a popup that open together cost one origin call.

const TIMETABLE_URL = "https://air.callshopradio.live/api/public/timetable";

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const params = new URLSearchParams();
	if (typeof query.from === "string" && query.from) params.set("from", query.from);
	if (typeof query.to === "string" && query.to) params.set("to", query.to);
	const suffix = params.toString() ? `?${params.toString()}` : "";

	setHeader(event, "cache-control", "public, max-age=60, stale-while-revalidate=120");

	try {
		return await $fetch(`${TIMETABLE_URL}${suffix}`, { timeout: 5000 });
	} catch {
		// A schedule outage must not break the page: callers hide their surface.
		return { from: null, to: null, timezone: "Europe/Berlin", timezoneLabel: "GMT+1", entries: [] };
	}
});
