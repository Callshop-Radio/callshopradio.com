import { ref, computed } from "vue";

export function useScheduleService() {
  const apiKey = process.env.NUXT_LIBRETIME_API_KEY;

  // Data refs
  const weekInfoData = ref({});
  const weekInfoWienData = ref({});
  const scheduleData = ref([]);

  // Helper function for API calls with authorization header
  const fetcher = async (url) => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Api-Key ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return null; // Return null on error
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
    try {
      const weekInfoUrl = "https://libretime.callshopradio.com/api/week-info";
      const weekInfoWienUrl = "https://wien.callshopradio.com/api/week-info";

      // Add parameters
      const weekInfoWienUrlWithParams = weekInfoWienUrl + "?days=7";

      // Generate URL for upcoming shows
      const timeWindow = getNextTwoWeeksWindow();
      const scheduleUrl = `https://libretime.callshopradio.com/api/shows?start=${timeWindow.start}&end=${timeWindow.end}`;

      // Fetch Düsseldorf with API key
      const weekInfo = await fetcher(weekInfoUrl).catch(() => {
        return {};
      });

      // Fetch Wien directly without API key
      let weekInfoWien = {};
      try {
        const wienResponse = await fetch(weekInfoWienUrlWithParams);
        if (wienResponse.ok) {
          weekInfoWien = await wienResponse.json();
        }
      } catch (wienError) {
        // Error handled silently
      }

      // Fetch schedule
      const schedule = await fetcher(scheduleUrl).catch(() => {
        return [];
      });

      // Set data
      weekInfoData.value = weekInfo || {};
      weekInfoWienData.value = weekInfoWien || {};
      scheduleData.value = schedule || [];
    } catch (err) {
      throw err;
    }
  };

  // Process weekinfo data into a uniform format
  const processWeekInfo = (weekInfo) => {
    // Return empty array if no data
    if (!weekInfo || Object.keys(weekInfo).length === 0) {
      return [];
    }

    // Ignore AIRTIME_API_VERSION entry
    const filtered = Object.entries(weekInfo).filter(
      ([key]) => key !== "AIRTIME_API_VERSION"
    );

    // Collect all events
    let allEvents = [];
    filtered.forEach(([dayName, dayContent]) => {
      // API responses have different structures depending on endpoint
      if (Array.isArray(dayContent)) {
        // Simple array structure
        allEvents = allEvents.concat(
          dayContent.map((event) => ({
            ...event,
            starts: event.start_timestamp || event.starts,
            ends: event.end_timestamp || event.ends,
          }))
        );
      } else if (dayContent && Array.isArray(dayContent[1])) {
        // Nested array structure (e.g. for week-info)
        allEvents = allEvents.concat(
          dayContent[1].map((event) => ({
            ...event,
            starts: event.start_timestamp || event.starts,
            ends: event.end_timestamp || event.ends,
          }))
        );
      }
    });

    // Mark live shows
    allEvents = allEvents.map((event) => ({
      ...event,
      isLive:
        event.description &&
        event.description.trim().toLowerCase().includes("live"),
    }));

    return allEvents;
  };

  // Computed properties for processed data
  const processedDusseldorf = computed(() =>
    processWeekInfo(weekInfoData.value)
  );
  const processedWien = computed(() => processWeekInfo(weekInfoWienData.value));

  // Getters for sorted shows
  const getDusseldorfShows = () => {
    return processedDusseldorf.value.sort(
      (a, b) =>
        new Date(a.starts || a.start_timestamp) -
        new Date(b.starts || b.start_timestamp)
    );
  };

  const getWienShows = () => {
    return processedWien.value.sort(
      (a, b) =>
        new Date(a.starts || a.start_timestamp) -
        new Date(b.starts || b.start_timestamp)
    );
  };

  return {
    fetchScheduleData,
    getDusseldorfShows,
    getWienShows,
  };
}