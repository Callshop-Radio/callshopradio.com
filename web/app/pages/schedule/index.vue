<script setup>
import { ref, computed, onMounted } from "vue";
import { SCHEDULE_QUERY } from "~~/queries/sanity.queries.ts";
import { useMainStore } from "~/stores/mainStore";

const query = groq`${SCHEDULE_QUERY}`;
const { data } = await useSanityQuery(query);

// Store einbinden
const mainStore = useMainStore();

// Status-Variablen
const loading = ref(true);
const error = ref(null);
const dusseldorfInstances = ref([]);
const instanceTracks = ref({});

// Service-Composables einbinden
const { fetchScheduleData, getDusseldorfShows, getWienShows } =
  useScheduleService();

const {
  formatDate,
  formatTimeRange,
  getShowStart,
  getShowEnd,
  getShowTitle,
  getShowDescription,
  isLiveShow,
  shouldShowInSchedule,
  groupShowsByDay,
} = useShowFormatters();

// Daten laden
const loadData = async () => {
  loading.value = true;
  error.value = null;

  try {
    await fetchScheduleData();
    extractDusseldorfInstances();
    await loadAllInstanceTracks(); // Tracks nach dem Extrahieren der Instances laden
  } catch (err) {
    console.error("Fehler beim Laden der Daten:", err);
    error.value =
      "Es ist ein Fehler beim Laden der Daten aufgetreten. Bitte versuche es später erneut.";
  } finally {
    loading.value = false;
  }
};

// Extrahiert die instanceID aus allen Düsseldorf-Shows
const extractDusseldorfInstances = () => {
  const allShows = getDusseldorfShows();
  // Set verwenden, um Duplikate zu vermeiden
  const instancesSet = new Set();

  for (const show of allShows) {
    // Wenn show.description leer ist oder nicht existiert, füge instance_id zum Set hinzu
    if (
      (!show.description || show.description.trim() === "") &&
      show.instance_id
    ) {
      instancesSet.add(show.instance_id);
    }
  }

  dusseldorfInstances.value = [...instancesSet];
  console.log(
    "Extrahierte Düsseldorf Instance IDs:",
    dusseldorfInstances.value
  );
};

// Alle Tracks für alle Instances parallel laden
const loadAllInstanceTracks = async () => {
  const tracksData = {};

  // Promises für alle Requests erstellen und parallel ausführen
  const fetchPromises = dusseldorfInstances.value.map(async (instanceId) => {
    try {
      const tracks = await fetchTracksForInstance(instanceId);
      if (tracks) {
        return { instanceId, tracks };
      }
      return null;
    } catch (error) {
      console.error(
        `Fehler beim Laden der Tracks für Instance ${instanceId}:`,
        error
      );
      return null;
    }
  });

  // Auf alle Promises warten und Ergebnisse verarbeiten
  const results = await Promise.all(fetchPromises);

  // Ergebnisse in tracksData zusammenführen
  for (const result of results) {
    if (result && result.instanceId && result.tracks) {
      tracksData[result.instanceId] = result.tracks;
    }
  }

  instanceTracks.value = tracksData;
  console.log(
    "Geladene Tracks für alle Instances:",
    Object.keys(tracksData).length
  );
};
// Daten beim Mounting laden
onMounted(() => {
  loadData();
});

// Tracks für eine Instance-ID laden
const fetchTracksForInstance = async (instanceId) => {
  try {
    const response = await fetch(
      `https://libretime.callshopradio.com/api/show-tracks/?instance_id=${instanceId}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(
      `Fehler beim Laden der Tracks für Instance ${instanceId}:`,
      err
    );
    return null;
  }
};

const integrateTracks = (shows, trackData) => {
  if (!shows || !trackData) return shows;

  // Tracks vorab sortieren und in Cache speichern, um wiederholte Sortierungen zu vermeiden
  const sortedTracksCache = {};

  for (const instanceId in trackData) {
    if (trackData[instanceId] && Array.isArray(trackData[instanceId])) {
      // Klonen und sortieren
      sortedTracksCache[instanceId] = [...trackData[instanceId]].sort(
        (a, b) => {
          if (a.starts && b.starts) {
            return new Date(a.starts) - new Date(b.starts);
          } else if (a.position !== undefined && b.position !== undefined) {
            return a.position - b.position;
          } else {
            return 0;
          }
        }
      );
    }
  }

  // Shows nur einmal durchlaufen und vorsortierten Cache nutzen
  return shows.map((show) => {
    const instanceId = show.instance_id;
    if (instanceId && sortedTracksCache[instanceId]) {
      return {
        ...show,
        tracks: sortedTracksCache[instanceId],
      };
    }
    return show;
  });
};

// Computed Properties für Shows
const dusseldorfShows = computed(() => {
  const shows = getDusseldorfShows();
  // Tracks in Shows integrieren vor dem Zurückgeben
  return integrateTracks(shows, instanceTracks.value);
});

const wienShows = computed(() => getWienShows());

// Gruppierte Shows für Düsseldorf und Wien
const groupedDusseldorfShows = computed(() =>
  groupShowsByDay(dusseldorfShows.value)
);

const groupedWienShows = computed(() => groupShowsByDay(wienShows.value));

// Computed Property für die Sichtbarkeit basierend auf dem aktiven Standort
const isLocationVisible = (location) => {
  return mainStore.activeScheduleLocation === location;
};

// Neulade-Funktion für manuelles Aktualisieren
const refreshData = () => {
  loadData();
};

usePageSeo(data?.value?.seo);
</script>

<template>
  <div class="schedule">
    <div v-if="loading" class="schedule__loading">
      <div class="loading-spinner"></div>
      <div class="loading-text">Loading</div>
    </div>

    <div v-else-if="error" class="schedule__error">
      <div class="error-message">{{ error }}</div>
      <button @click="refreshData" class="refresh-button">Reload</button>
    </div>

    <div v-else class="schedule__content">
      <!-- Düsseldorf Shows -->
      <ModuleScheduleSlider
        v-if="isLocationVisible('channelOne')"
        :groups="groupedDusseldorfShows"
        :formatDate="formatDate"
        :getShowTitle="getShowTitle"
        :getShowDescription="getShowDescription"
        :getShowStart="getShowStart"
        :getShowEnd="getShowEnd"
        :formatTimeRange="formatTimeRange"
        :isLiveShow="isLiveShow"
      />

      <!-- Wien Shows -->
      <ModuleScheduleSlider
        v-if="isLocationVisible('channelTwo')"
        :groups="groupedWienShows"
        :formatDate="formatDate"
        :getShowTitle="getShowTitle"
        :getShowDescription="getShowDescription"
        :getShowStart="getShowStart"
        :getShowEnd="getShowEnd"
        :formatTimeRange="formatTimeRange"
        :isLiveShow="isLiveShow"
      />
    </div>
    <MediaImage
        v-if="data?.backgroundImage"
        :image="data?.backgroundImage"
        class="schedule__background-image"
      />
  </div>
</template>

<style lang="postcss" scoped>
.schedule {
  max-width: var(--page-max-width);
  width: 100%;
  display: flex;
  flex-flow: column;
  justify-content: flex-start;
  align-items: flex-start;
  &__background-image {
    position: absolute;
    top: calc(var(--big-margin) * 2);
    left: -10vw;
    min-width: 120vw;
    height: auto;
    filter: blur(30px);
    z-index: 0;
  }
  &__content {
    z-index: 10;
    width: 100%;
    display: flex;
    flex-flow: column;
    justify-content: flex-start;
    align-items: flex-start;
  }
}


</style>