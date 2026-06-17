// Never let an error response be cached.
//
// On ISR routes a transient 4xx/5xx (a deploy-swap window, a cold-function
// hiccup, a brief Sanity error) was getting stored in Netlify's durable cache
// and then served persistently — a single blip froze a URL as a 404/500 until
// the next deploy purged it. Forcing no-store on any error render means a blip
// is never stored: the very next request just re-renders the page.
export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook("render:response", (response) => {
		const status = response.statusCode ?? 200;
		if (status < 400) return;

		response.headers = {
			...response.headers,
			"cache-control": "no-store, must-revalidate",
			// Netlify's CDN / durable (ISR) cache is controlled separately from
			// the standard Cache-Control header — disable it explicitly too.
			"netlify-cdn-cache-control": "no-store",
		};
	});
});
