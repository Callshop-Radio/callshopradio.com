type UmamiTracker = {
	track: (eventName: string, eventData?: Record<string, unknown>) => void;
};

export type AccountEvent = "set-saved" | "set-unsaved";

/**
 * Product events for saved sets. Umami is only loaded after the visitor
 * accepts the analytics category, so `window.umami` being present is the
 * consent gate — no second consent check to drift out of sync. SSR and
 * environments without the tracker are a no-op.
 */
export function useAccountTracking() {
	function track(event: AccountEvent, data: Record<string, unknown>) {
		if (typeof window === "undefined") return;
		const umami = (window as Window & { umami?: UmamiTracker }).umami;
		umami?.track(event, data);
	}

	return { track };
}
