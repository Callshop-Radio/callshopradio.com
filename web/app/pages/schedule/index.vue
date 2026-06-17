<script setup>
import { computed, onMounted, ref } from "vue";
import { useMainStore } from "~/stores/mainStore";
import { SCHEDULE_QUERY } from "~~/queries/sanity.queries.ts";

definePageMeta({
	bodyClass: "schedule",
});

const query = groq`${SCHEDULE_QUERY}`;
const { data } = await useCachedSanityQuery(query);

// Connect store
const mainStore = useMainStore();

// Status variables
const loading = ref(true);
const error = ref(null);
const dusseldorfInstances = ref([]);
const instanceTracks = ref({});

// Current time management
const _currentTime = ref(new Date());
const _timeUpdateInterval = ref(null);

// Constants for time display
const GRID_START_HOUR = 7;
const GRID_END_HOUR = 24;
const GRID_TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR;
const GRID_SEGMENTS_PER_HOUR = 2; // 30-minute segments
const _GRID_TOTAL_SEGMENTS = Math.min(
	GRID_TOTAL_HOURS * GRID_SEGMENTS_PER_HOUR,
	35,
); // At most 35 segments

// Connect service composables
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
	shouldShowInSchedule: _shouldShowInSchedule,
	groupShowsByDay,
} = useShowFormatters();

// Load data
const loadData = async () => {
	loading.value = true;
	error.value = null;

	try {
		await fetchScheduleData();
		extractDusseldorfInstances();
		await loadAllInstanceTracks();
	} catch (err) {
		console.error("❌ Fehler beim Laden der Daten:", err);
		error.value =
			"Es ist ein Fehler beim Laden der Daten aufgetreten. Bitte versuche es später erneut.";
	} finally {
		loading.value = false;
	}
};

// Extracts the instanceID from all Düsseldorf shows
const extractDusseldorfInstances = () => {
	const allShows = getDusseldorfShows();
	const instancesSet = new Set();

	for (const show of allShows) {
		if (
			(!show.description || show.description.trim() === "") &&
			show.instance_id
		) {
			instancesSet.add(show.instance_id);
		}
	}

	dusseldorfInstances.value = [...instancesSet];
};

// Load all tracks for all instances in parallel
const loadAllInstanceTracks = async () => {
	const tracksData = {};

	const fetchPromises = dusseldorfInstances.value.map(async (instanceId) => {
		try {
			const tracks = await fetchTracksForInstance(instanceId);
			if (tracks) {
				return { instanceId, tracks };
			}
			return null;
		} catch (error) {
			console.error(
				`❌ Error loading tracks for instance ${instanceId}:`,
				error,
			);
			return null;
		}
	});

	const results = await Promise.all(fetchPromises);

	for (const result of results) {
		if (result?.instanceId && result.tracks) {
			tracksData[result.instanceId] = result.tracks;
		}
	}

	instanceTracks.value = tracksData;
};
// Load data on mount
onMounted(() => {
	loadData();
});

// Load tracks for an instance ID
const fetchTracksForInstance = async (instanceId) => {
	try {
		const url = `https://libretime.callshopradio.com/api/show-tracks/?instance_id=${instanceId}`;
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! Status: ${response.status}`);
		}
		const data = await response.json();

		// Log cue points for all tracks in this instance
		if (data && Array.isArray(data) && data.length > 0) {
			// reserved for cue-point logging
		}

		return data;
	} catch (err) {
		console.error(`❌ Error fetching tracks for instance ${instanceId}:`, err);
		return null;
	}
};

const integrateTracks = (shows, trackData) => {
	if (!shows || !trackData) return shows;

	// Pre-sort tracks and store them in a cache to avoid repeated sorting
	const sortedTracksCache = {};

	for (const instanceId in trackData) {
		if (trackData[instanceId] && Array.isArray(trackData[instanceId])) {
			// Clone and sort
			sortedTracksCache[instanceId] = [...trackData[instanceId]].sort(
				(a, b) => {
					if (a.starts && b.starts) {
						return new Date(a.starts) - new Date(b.starts);
					} else if (a.position !== undefined && b.position !== undefined) {
						return a.position - b.position;
					} else {
						return 0;
					}
				},
			);
		}
	}

	// Iterate over shows only once and use the pre-sorted cache
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

// Computed properties for shows
const dusseldorfShows = computed(() => {
	const shows = getDusseldorfShows();
	// Integrate tracks into shows before returning
	return integrateTracks(shows, instanceTracks.value);
});

const wienShows = computed(() => getWienShows());

// Grouped shows for Düsseldorf and Vienna
const groupedDusseldorfShows = computed(() =>
	groupShowsByDay(dusseldorfShows.value),
);

const groupedWienShows = computed(() => groupShowsByDay(wienShows.value));

// Computed property for visibility based on the active location
const isLocationVisible = (location) => {
	return mainStore.activeScheduleLocation === location;
};

// Reload function for manual refresh
const refreshData = () => {
	loadData();
};

usePageSeo(data?.value?.seo);
</script>

<template>
	<div class="schedule page-full-bleed">
		<div class="schedule__background">
			<MediaImage
				v-if="data?.backgroundImage"
				:image="data?.backgroundImage"
				class="schedule__background__image"
			/>
		</div>
		<div v-if="loading" class="schedule__loading" />

		<div v-else-if="error" class="schedule__error">
			<div class="error-message">{{ error }}</div>
			<button class="refresh-button" @click="refreshData">Reload</button>
		</div>

		<div v-else class="schedule__content">
			<!-- Düsseldorf shows -->
			<ModuleScheduleSlider
				v-if="isLocationVisible('channelOne')"
				:groups="groupedDusseldorfShows"
				:format-date="formatDate"
				:get-show-title="getShowTitle"
				:get-show-description="getShowDescription"
				:get-show-start="getShowStart"
				:get-show-end="getShowEnd"
				:format-time-range="formatTimeRange"
				:is-live-show="isLiveShow"
			/>

			<!-- Vienna shows -->
			<ModuleScheduleSlider
				v-if="isLocationVisible('channelTwo')"
				:groups="groupedWienShows"
				:format-date="formatDate"
				:get-show-title="getShowTitle"
				:get-show-description="getShowDescription"
				:get-show-start="getShowStart"
				:get-show-end="getShowEnd"
				:format-time-range="formatTimeRange"
				:is-live-show="isLiveShow"
			/>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.schedule {
  position: relative;
  min-height: max-content;
  /* max-width: calc(var(--page-max-width) + ((100svw - var(--page-max-width)) / 2));
  margin: 0 0 0 calc((100svw - var(--page-max-width)) / 2); */
  width: 100%;
  display: flex;
  flex-flow: column;
  justify-content: flex-start;
  align-items: flex-start;

  &__background {
    position: fixed;
    top: calc(var(--big-margin));
    flex-grow: 1;
    left: 0;
    height: calc(180svh - var(--big-margin) * 2);
    width: 100svw;
    max-width: 100svw;
    overflow: hidden;
    &__image {
      position: absolute;
      top: 0;
      left: -10vw;
      min-width: 120vw;
      height: auto;
      z-index: 0;
      object-fit: cover;
      z-index: -1;
      filter: saturate(0.75) blur(30px) brightness(0.95);
    }
  }
  &__content {
    z-index: 10;
    width: 100%;
  }
}
</style>