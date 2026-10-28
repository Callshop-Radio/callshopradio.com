export type AnalyticsParams = Record<
	string,
	string | number | boolean | null | undefined
>;

type UmamiTracker = {
	track: (eventName: string, eventData?: Record<string, unknown>) => void;
};

/**
 * One call site for product analytics.
 *
 * Components call `track()` once; the event is sent to GA4 (via nuxt-gtag)
 * and to the self-hosted Umami instance (if its runtime config is set). Both
 * providers are gated by the "analytics" cookie-consent category, and the
 * function is a no-op during SSR.
 */
export function useAnalytics() {
	const { gtag } = useGtag();

	function track(eventName: string, params: AnalyticsParams = {}) {
		if (import.meta.server || !hasAnalyticsConsent()) return;

		// Drop empty values so GA4/Umami don't receive `null` or `undefined`.
		const data = Object.fromEntries(
			Object.entries(params).filter(
				([, value]) => value !== undefined && value !== null,
			),
		);

		gtag("event", eventName, data);

		const umami = (window as Window & { umami?: UmamiTracker }).umami;
		umami?.track(eventName, data);
	}

	return { track };
}
