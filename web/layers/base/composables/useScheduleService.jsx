import { computed, ref } from "vue";

export function useScheduleService() {
	// Data refs
	const weekInfoData = ref({});
	const weekInfoWienData = ref({});
	const scheduleData = ref([]);

	// LibreTime calls go through the server proxy (key stays server-side).
	// Public endpoints (e.g. wien.callshopradio.com) are called directly.
	const fetcher = async (url, requiresAuth = false) => {
		try {
			if (requiresAuth) {
				const path = new URL(url).pathname + new URL(url).search;
				return await $fetch("/api/libretime-proxy", { query: { path } });
			}
			return await $fetch(url);
		} catch (error) {
			console.error(`[useScheduleService] Fetch error for ${url}:`, error);
			return null;
		}
	};

	// Helper function to calculate time window for next 2 weeks
	const getNextTwoWeeksWindow = () => {
		const now = new Date();
		const twoWeeksLater = new Date();
		twoWeeksLater.setDate(now.getDate() + 14);

		return {
			start: now.toISOString(),
			end: twoWeeksLater.toISOString(),
		};
	};

	// Load all data
	const fetchScheduleData = async () => {
		const weekInfoUrl = "https://libretime.callshopradio.com/api/week-info";
		const weekInfoWienUrl =
			"https://wien.callshopradio.com/api/week-info?days=7";

		// Generate URL for upcoming shows
		const timeWindow = getNextTwoWeeksWindow();
		const scheduleUrl = `https://libretime.callshopradio.com/api/shows?start=${timeWindow.start}&end=${timeWindow.end}`;

		// Fetch all data in parallel via proxy
		const [weekInfo, weekInfoWien, schedule] = await Promise.all([
			fetcher(weekInfoUrl, true).catch(() => ({})), // Düsseldorf with auth
			fetcher(weekInfoWienUrl, false).catch(() => ({})), // Wien without auth
			fetcher(scheduleUrl, true).catch(() => []), // Schedule with auth
		]);

		// Set data
		weekInfoData.value = weekInfo || {};
		weekInfoWienData.value = weekInfoWien || {};
		scheduleData.value = schedule || [];
	};

	// Process weekinfo data into a uniform format
	const processWeekInfo = (weekInfo) => {
		// Return empty array if no data
		if (!weekInfo || Object.keys(weekInfo).length === 0) {
			return [];
		}

		// Ignore AIRTIME_API_VERSION entry
		const filtered = Object.entries(weekInfo).filter(
			([key]) => key !== "AIRTIME_API_VERSION",
		);

		// Collect all events
		let allEvents = [];
		filtered.forEach(([_dayName, dayContent]) => {
			// API responses have different structures depending on endpoint
			if (Array.isArray(dayContent)) {
				// Simple array structure
				allEvents = allEvents.concat(
					dayContent.map((event) => ({
						...event,
						starts: event.start_timestamp || event.starts,
						ends: event.end_timestamp || event.ends,
					})),
				);
			} else if (dayContent && Array.isArray(dayContent[1])) {
				// Nested array structure (e.g. for week-info)
				allEvents = allEvents.concat(
					dayContent[1].map((event) => ({
						...event,
						starts: event.start_timestamp || event.starts,
						ends: event.end_timestamp || event.ends,
					})),
				);
			}
		});

		// Mark live shows
		allEvents = allEvents.map((event) => ({
			...event,
			isLive: event.description?.trim().toLowerCase().includes("live"),
		}));

		return allEvents;
	};

	// Computed properties for processed data
	const processedDusseldorf = computed(() =>
		processWeekInfo(weekInfoData.value),
	);
	const processedWien = computed(() => processWeekInfo(weekInfoWienData.value));

	// Getters for sorted shows
	const getDusseldorfShows = () => {
		return processedDusseldorf.value.sort(
			(a, b) =>
				new Date(a.starts || a.start_timestamp) -
				new Date(b.starts || b.start_timestamp),
		);
	};

	const getWienShows = () => {
		return processedWien.value.sort(
			(a, b) =>
				new Date(a.starts || a.start_timestamp) -
				new Date(b.starts || b.start_timestamp),
		);
	};

	return {
		fetchScheduleData,
		getDusseldorfShows,
		getWienShows,
	};
}
