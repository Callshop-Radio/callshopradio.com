export type AnalyticsParams = Record<
	string,
	string | number | boolean | null | undefined
>;

type UmamiTracker = {
	track: (eventName: string, eventData?: Record<string, unknown>) => void;
};

/**
 * One call site for product analytics: every event goes to the self-hosted
 * Umami instance (when its runtime config is set). The "analytics" cookie
 * category gates it, and the function is a no-op during SSR.
 */
export function useAnalytics() {
	function track(eventName: string, params: AnalyticsParams = {}) {
		if (import.meta.server || !hasAnalyticsConsent()) return;

		// Drop empty values so Umami does not receive `null` or `undefined`.
		const data = Object.fromEntries(
			Object.entries(params).filter(
				([, value]) => value !== undefined && value !== null,
			),
		);

		const umami = (window as Window & { umami?: UmamiTracker }).umami;
		umami?.track(eventName, data);
	}

	// Older call sites used a separate Umami-only helper; both names still work.
	return { track, trackUmami: track };
}
