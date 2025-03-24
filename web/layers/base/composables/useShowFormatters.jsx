export function useShowFormatters() {
  // Hilfsfunktionen zum Extrahieren von Show-Eigenschaften
  const getShowStart = (show) => {
    return show.starts || show.start_timestamp || show.start;
  };

  const getShowEnd = (show) => {
    return show.ends || show.end_timestamp || show.end;
  };

  const getShowTitle = (show) => {
    return show.name || show.title || "Unbekannter Titel";
  };

  const getShowDescription = (show) => {
    return show.description || show.instance_description || "";
  };
  const shouldShowInSchedule = (show) => {
    // Start- und Endzeit der Show
    const startTime = new Date(getShowStart(show));
    const endTime = new Date(getShowEnd(show));

    // Überprüfung der Uhrzeit (zwischen 8:00 und 00:00)
    const startHour = startTime.getHours();

    // Live-Shows werden immer angezeigt
    if (isLiveShow(show)) {
      return true;
    }

    // Normale Shows nur anzeigen, wenn sie kürzer als 3 Stunden sind
    // und zwischen 8:00 und 00:00 Uhr stattfinden
    return startHour >= 7 && startHour < 24;
  };

  const isLiveShow = (show) => {
    return show.isLive || false;
  };

  // Formatierungsfunktionen
  const formatDate = (dateString, includeFullDay = false) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    if (includeFullDay) {
      // Vollständiges Format für die "Kommende Shows"-Liste
      const options = {
        weekday: "long", // Wochentag ausgeschrieben
        day: "2-digit",
        month: "long",
        year: "numeric",
      };
      return date.toLocaleDateString("de-DE", options);
    } else {
      // Format für die Tagesüberschriften mit Wochentag
      const options = {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      };
      return date.toLocaleDateString("de-DE", options);
    }
  };

  // Hilfsfunktion zur Formatierung von Zeitbereichen
  const formatTimeRange = (startTime, endTime, includeDate = false) => {
    if (!startTime || !endTime) return "";

    const start = new Date(startTime);
    const end = new Date(endTime);

    const timeOptions = { hour: "2-digit", minute: "2-digit" };

    if (includeDate) {
      return `${start.toLocaleTimeString(
        "de-DE",
        timeOptions
      )} - ${end.toLocaleTimeString("de-DE", timeOptions)}`;
    } else {
      return `${start.toLocaleTimeString(
        "de-DE",
        timeOptions
      )} - ${end.toLocaleTimeString("de-DE", timeOptions)}`;
    }
  };

  // Hilfsfunktion zur Gruppierung von Shows nach Tag
  // ...existing code...
  // Hilfsfunktion zur Gruppierung von Shows nach Tag
  const groupShowsByDay = (shows) => {
    // Zuerst alle Shows filtern, die wir anzeigen möchten
    const filteredShows = shows.filter(shouldShowInSchedule);

    // Wenn keine Shows übrig bleiben, gib leeres Array zurück
    if (filteredShows.length === 0) {
      return [];
    }

    const groupedShows = {};

    // Aktuelles Datum für den Vergleich (nur Datum ohne Zeit)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    filteredShows.forEach((show) => {
      const startDate = new Date(getShowStart(show));
      // Datum ohne Zeit für den Vergleich setzen
      const showDate = new Date(startDate);
      showDate.setHours(0, 0, 0, 0);

      // Nur Shows von heute oder aus der Zukunft berücksichtigen
      if (showDate >= today) {
        const dayKey = startDate.toISOString().split("T")[0]; // YYYY-MM-DD Format

        // Flag für heutigen Tag
        const isToday = showDate.getTime() === today.getTime();

        if (!groupedShows[dayKey]) {
          groupedShows[dayKey] = {
            date: startDate,
            shows: [],
            isToday: isToday, // Neues Flag für den heutigen Tag
          };
        }

        groupedShows[dayKey].shows.push(show);
      }
    });

    // Nur Tage mit Shows zurückgeben
    return Object.values(groupedShows)
      .filter((group) => group.shows.length > 0)
      .sort((a, b) => a.date - b.date);
  };
  // ...existing code...
  return {
    getShowStart,
    getShowEnd,
    getShowTitle,
    getShowDescription,
    isLiveShow,
    shouldShowInSchedule,
    formatDate,
    formatTimeRange,
    groupShowsByDay,
  };
}
