import { readonly, ref } from "vue";

// Single source of truth for the "analytics" consent category. The cookie
// consent plugin writes it; Umami reads it before every send. Keeping this
// outside the components means a consent change applies immediately, even for
// components that are already mounted.
const analyticsConsent = ref(false);

export function useAnalyticsConsent() {
	return {
		analyticsConsent: readonly(analyticsConsent),
		setAnalyticsConsent(value: boolean) {
			analyticsConsent.value = value;
		},
	};
}

/** True only after the visitor accepted the "analytics" cookie category. */
export function hasAnalyticsConsent(): boolean {
	return analyticsConsent.value;
}
