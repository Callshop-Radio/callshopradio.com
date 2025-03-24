import { ref, computed } from "vue";

export function useScheduleService() {
  const apiKey = process.env.NUXT_LIBRETIME_API_KEY;

  // Daten-Refs
  const weekInfoData = ref({});
  const weekInfoWienData = ref({});
  const scheduleData = ref([]);

  // Hilfsfunktion für API-Aufrufe mit Authorization-Header
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
      console.error(`Fehler beim Abrufen von ${url}:`, error);
      return null; // Rückgabe von null im Fehlerfall
    }
  };

  // Hilfsfunktion zur Berechnung des Zeitfensters für die nächsten 2 Wochen
  const getNextTwoWeeksWindow = () => {
    const now = new Date();
    const twoWeeksLater = new Date();
    twoWeeksLater.setDate(now.getDate() + 14);

    return {
      start: now.toISOString(),
      end: twoWeeksLater.toISOString(),
    };
  };

  // Alle Daten laden
  const fetchScheduleData = async () => {
    try {
      const weekInfoUrl = "https://libretime.callshopradio.com/api/week-info";
      const weekInfoWienUrl = "https://wien.callshopradio.com/api/week-info";

      // Füge Parameter hinzu
      const weekInfoWienUrlWithParams = weekInfoWienUrl + "?days=7";

      // URL für die nächsten Shows generieren
      const timeWindow = getNextTwoWeeksWindow();
      const scheduleUrl = `https://libretime.callshopradio.com/api/shows?start=${timeWindow.start}&end=${timeWindow.end}`;

      // Düsseldorf mit API-Key abrufen
      const weekInfo = await fetcher(weekInfoUrl).catch((e) => {
        console.error("Fehler beim Laden von Düsseldorf-Daten:", e);
        return {};
      });

      // Wien direkt ohne API-Key abrufen
      let weekInfoWien = {};
      try {
        const wienResponse = await fetch(weekInfoWienUrlWithParams);
        if (wienResponse.ok) {
          weekInfoWien = await wienResponse.json();
        } else {
          console.error(
            "Wien-Daten Fehler:",
            wienResponse.status,
            wienResponse.statusText
          );
        }
      } catch (wienError) {
        console.error("Fehler beim Laden von Wien-Daten:", wienError);
      }

      // Schedule abrufen
      const schedule = await fetcher(scheduleUrl).catch((e) => {
        console.error("Fehler beim Laden des Schedules:", e);
        return [];
      });

      // Daten setzen
      weekInfoData.value = weekInfo || {};
      weekInfoWienData.value = weekInfoWien || {};
      scheduleData.value = schedule || [];
    } catch (err) {
      console.error("Fehler beim Laden der Daten:", err);
      throw err;
    }
  };

  // Verarbeite Weekinfo-Daten in ein einheitliches Format
  const processWeekInfo = (weekInfo) => {
    // Wenn keine Daten vorhanden sind, leeres Array zurückgeben
    if (!weekInfo || Object.keys(weekInfo).length === 0) {
      return [];
    }

    // Ignorieren Sie den AIRTIME_API_VERSION-Eintrag
    const filtered = Object.entries(weekInfo).filter(
      ([key]) => key !== "AIRTIME_API_VERSION"
    );

    // Alle Events sammeln
    let allEvents = [];
    filtered.forEach(([dayName, dayContent]) => {
      // Die API-Antworten haben unterschiedliche Strukturen je nach Endpunkt
      if (Array.isArray(dayContent)) {
        // Einfache Array-Struktur
        allEvents = allEvents.concat(
          dayContent.map((event) => ({
            ...event,
            starts: event.start_timestamp || event.starts,
            ends: event.end_timestamp || event.ends,
          }))
        );
      } else if (dayContent && Array.isArray(dayContent[1])) {
        // Verschachtelte Array-Struktur (z.B. für week-info)
        allEvents = allEvents.concat(
          dayContent[1].map((event) => ({
            ...event,
            starts: event.start_timestamp || event.starts,
            ends: event.end_timestamp || event.ends,
          }))
        );
      }
    });

    // Live-Shows markieren
    allEvents = allEvents.map((event) => ({
      ...event,
      isLive:
        event.description &&
        event.description.trim().toLowerCase().includes("live"),
    }));

    return allEvents;
  };

  // Computed Properties für verarbeitete Daten
  const processedDusseldorf = computed(() =>
    processWeekInfo(weekInfoData.value)
  );
  const processedWien = computed(() => processWeekInfo(weekInfoWienData.value));

  // Getter für sortierte Shows
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