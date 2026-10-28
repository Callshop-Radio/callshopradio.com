export default defineNuxtPlugin(() => {
	const config = useRuntimeConfig();
	const host = String(config.public.umamiHost ?? "").replace(/\/+$/, "");
	const websiteId = String(config.public.umamiId ?? "");

	// No config -> no script, no requests. Keeps local environments quiet
	// unless the Umami variables are explicitly set.
	if (!host || !websiteId) return;

	const domains = String(config.public.umamiDomains ?? "");
	let script: HTMLScriptElement | null = null;

	// The tracker calls this before every send. It is the last line of defence
	// if consent is withdrawn while the script is still loaded.
	(
		window as Window & { __callshopUmamiBeforeSend?: unknown }
	).__callshopUmamiBeforeSend = (_type: string, payload: unknown) =>
		hasAnalyticsConsent() ? payload : false;

	function load() {
		if (script) return;

		script = document.createElement("script");
		script.src = `${host}/script.js`;
		script.defer = true;
		script.dataset.websiteId = websiteId;
		if (domains) script.dataset.domains = domains;
		// Core Web Vitals are part of the performance work on this site.
		script.dataset.performance = "true";
		// Never put search terms (or other query params) into page-view URLs;
		// the explicit `search` event carries the term instead.
		script.dataset.excludeSearch = "true";
		script.dataset.doNotTrack = "true";
		script.dataset.beforeSend = "__callshopUmamiBeforeSend";
		document.head.appendChild(script);
	}

	function unload() {
		script?.remove();
		script = null;

		try {
			delete (window as Window & { umami?: unknown }).umami;
		} catch {
			// The tracker may have defined a non-configurable property.
		}
	}

	watch(
		() => hasAnalyticsConsent(),
		(consent) => {
			if (consent) load();
			else unload();
		},
		{ immediate: true },
	);
});
