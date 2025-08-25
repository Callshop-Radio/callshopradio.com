<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import emblaCarouselVue from "embla-carousel-vue";
import { useThrottleFn } from "@vueuse/core";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();

interface Group {
  date: string | Date;
  shows: any[];
  isToday?: boolean;
}

interface ProcessedItem {
  type: "show" | "track";
  id: string;
  title: string;
  artist?: string;
  startTime: Date;
  endTime: Date;
  formattedTime: string;
  date: string | Date;
  isLive?: boolean;
}

const props = defineProps<{
  groups: Group[];
  formatDate: (date: string | Date, includeFullDay?: boolean) => string;
  getShowTitle: (show: any) => string;
  getShowStart: (show: any) => string;
  getShowEnd: (show: any) => string;
  formatTimeRange: (
    startTime: string,
    endTime: string,
    includeDate?: boolean
  ) => string;
  getShowDescription: (show: any) => string;
  isLiveShow: (show: any) => boolean;
}>();

// Carousel setup
const [emblaNode, emblaApi] = emblaCarouselVue({
  align: "start",
  containScroll: false,
});

const currentSlideIndex = ref(0);
const canScrollPrev = ref(false);
const canScrollNext = ref(true);

// Time management
const currentTime = ref(new Date());
const timeUpdateInterval = ref<NodeJS.Timeout | null>(null);

// Current time formatting and positioning
const currentTimeFormatted = computed(() => {
  const hours = currentTime.value.getHours().toString().padStart(2, "0");
  const minutes = currentTime.value.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
});

const currentTimeIndicatorStyle = computed(() => {
  const now = currentTime.value;
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Check if current time is within our grid range (7-24h)
  if (hours < GRID_START_HOUR || hours >= GRID_END_HOUR) {
    return { display: "none" };
  }

  // Use the same calculation as timeToGridSegment for consistency
  const decimalHours = hours - GRID_START_HOUR + minutes / 60;
  const segments = decimalHours * GRID_SEGMENTS_PER_HOUR;
  
  // Calculate grid row position (1-indexed for CSS Grid)
  const gridRow = Math.floor(segments) + 1;
  
  // Calculate offset within the current grid cell
  const segmentFraction = segments - Math.floor(segments);
  const offsetPercentage = segmentFraction * 100;

  return {
    gridRow: `${gridRow}`,
    gridColumn: "1",
    position: "relative" as const,
    top: `${offsetPercentage}%`,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
    zIndex: 20,
    pointerEvents: "none" as const,
    marginLeft: "var(--small-padding)",
  };
});

// Check if current time marker should be shown for a specific date
const shouldShowTimeMarkerForDate = (date: string | Date): boolean => {
  const now = currentTime.value;
  const targetDate = new Date(date);

  // Check if it's the same day
  return (
    now.getDate() === targetDate.getDate() &&
    now.getMonth() === targetDate.getMonth() &&
    now.getFullYear() === targetDate.getFullYear()
  );
};

// Constants
const GRID_START_HOUR = 7;
const GRID_END_HOUR = 24;
const GRID_TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR;
const GRID_SEGMENTS_PER_HOUR = 2; // 30-Minuten-Segmente
const GRID_TOTAL_SEGMENTS = Math.min(
  GRID_TOTAL_HOURS * GRID_SEGMENTS_PER_HOUR,
  35
); // Maximal 35 Segmente

// Utility functions (memoized)
const parseTrackLength = (
  length: string
): { hours: number; minutes: number; seconds: number } => {
  const parts = length.split(":");
  if (parts.length === 3) {
    return {
      hours: parseInt(parts[0] || "0", 10) || 0,
      minutes: parseInt(parts[1] || "0", 10) || 0,
      seconds: parseFloat(parts[2] || "0") || 0,
    };
  } else if (parts.length === 2) {
    return {
      hours: 0,
      minutes: parseInt(parts[0] || "0", 10) || 0,
      seconds: parseFloat(parts[1] || "0") || 0,
    };
  }
  return { hours: 0, minutes: 0, seconds: 0 };
};

const calculateTrackEndTime = (track: any): Date | null => {
  if (!track.starts) return null;

  const startTime = new Date(track.starts);

  // For tracks: calculate end time using cue_out (duration format HH:MM:SS)
  if (track.cue_out) {
    const { hours, minutes, seconds } = parseTrackLength(track.cue_out);
    if (hours > 0 || minutes > 0 || seconds > 0) {
      const endTime = new Date(startTime.getTime());
      endTime.setHours(endTime.getHours() + hours);
      endTime.setMinutes(endTime.getMinutes() + minutes);
      endTime.setSeconds(endTime.getSeconds() + Math.floor(seconds));
      return endTime;
    }
  }

  // Fallback: Use length field if cue_out is not available
  if (track.length) {
    const { hours, minutes, seconds } = parseTrackLength(track.length);
    const endTime = new Date(startTime.getTime());
    endTime.setHours(endTime.getHours() + hours);
    endTime.setMinutes(endTime.getMinutes() + minutes);
    endTime.setSeconds(endTime.getSeconds() + Math.floor(seconds));
    return endTime;
  }

  // If no duration info available, return startTime (0 duration)
  return startTime;
};

const formatTrackTime = (dateTime: Date | null): string => {
  if (!dateTime || isNaN(dateTime.getTime())) return "";

  // No rounding - use exact time
  const hours = dateTime.getHours().toString().padStart(2, "0");
  const minutes = dateTime.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
};

const getTrackTimeRange = (track: any): string => {
  if (!track.starts) return "";

  const startTime = new Date(track.starts);
  const endTime = calculateTrackEndTime(track);
  const startFormatted = formatTrackTime(startTime);

  if (!endTime) return startFormatted;

  const endFormatted = formatTrackTime(endTime);
  return `${startFormatted} – ${endFormatted}`;
};

// Helper function to convert time to grid segment
const timeToGridSegment = (date: Date): number => {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  // Convert to decimal hours from GRID_START_HOUR
  const decimalHours = hours - GRID_START_HOUR + minutes / 60;

  // Convert to 30-minute segments (no rounding - floor for exact positioning)
  const segments = Math.floor(decimalHours * GRID_SEGMENTS_PER_HOUR);

  return Math.max(0, Math.min(segments, GRID_TOTAL_SEGMENTS - 1));
};

// Helper function to calculate show duration in segments
const calculateShowDurationInSegments = (
  startTime: Date,
  endTime: Date
): number => {
  const startSegment = timeToGridSegment(startTime);

  // Handle end time: if 00:00, calculate as if it's 24:00 (end of same day)
  let endHours = endTime.getHours();
  let endMinutes = endTime.getMinutes();

  // If end time is 00:00, treat it as 24:00 for calculation
  if (endHours === 0 && endMinutes === 0) {
    endHours = 24;
    endMinutes = 0;
  }

  // Calculate end segment with the corrected end time
  let endDecimalHours = endHours - GRID_START_HOUR + endMinutes / 60;

  // If end time is after our grid (24h), clamp it to the grid end
  if (endDecimalHours > GRID_TOTAL_HOURS) {
    endDecimalHours = GRID_TOTAL_HOURS;
  }

  const endSegment = Math.floor(endDecimalHours * GRID_SEGMENTS_PER_HOUR);
  const clampedEndSegment = Math.max(
    0,
    Math.min(endSegment, GRID_TOTAL_SEGMENTS)
  );

  // Calculate exact duration in segments
  const durationSegments = clampedEndSegment - startSegment;

  // Debug logging
  console.log(`🧮 Duration Calculation:`, {
    startTime: startTime.toLocaleTimeString(),
    originalEndTime: endTime.toLocaleTimeString(),
    calculatedEndHours: endHours,
    endDecimalHours,
    startSegment,
    endSegment,
    clampedEndSegment,
    durationSegments,
    endTimeWasMidnight: endTime.getHours() === 0 && endTime.getMinutes() === 0,
  });

  // Ensure minimum 1 segment duration
  return Math.max(1, durationSegments);
};

// Helper function to calculate item duration in segments (differentiates between shows and tracks)
const calculateItemDurationInSegments = (item: ProcessedItem): number => {
  if (item.type === "show") {
    // For shows: use traditional start/end time calculation
    return calculateShowDurationInSegments(item.startTime, item.endTime);
  } else {
    // For tracks: use calculated track end time (from cue points)
    return calculateShowDurationInSegments(item.startTime, item.endTime);
  }
};

// Format grid segment time for display
const formatGridSegmentTime = (segment: number): string => {
  const hours = Math.floor(segment / GRID_SEGMENTS_PER_HOUR) + GRID_START_HOUR;
  const minutes = (segment % GRID_SEGMENTS_PER_HOUR) * 30;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

// Main computed property - processes all items once
const processedItems = computed(() => {
  if (!props.groups?.length) return new Map<string, ProcessedItem[]>();

  const itemsByDate = new Map<string, ProcessedItem[]>();

  for (const group of props.groups) {
    const dateKey = new Date(group.date).toDateString();
    const items: ProcessedItem[] = [];

    for (const show of group.shows) {
      const description = props.getShowDescription(show);

      // Log show processing
      if (show.tracks?.length > 0) {
        // console.log(`🎵 Processing show with tracks:`, {
        //   showTitle: props.getShowTitle(show),
        //   showStart: props.getShowStart(show),
        //   showEnd: props.getShowEnd(show),
        //   tracksCount: show.tracks.length,
        //   firstTrack: show.tracks[0] ? {
        //     title: show.tracks[0].title,
        //     starts: show.tracks[0].starts,
        //     length: show.tracks[0].length,
        //     artist: show.tracks[0].artist || show.tracks[0].creator || show.tracks[0].performer
        //   } : null
        // });
      }

      // Only add live shows
      if (description?.toLowerCase() === "live") {
        const showStartTime = new Date(props.getShowStart(show));
        const showEndTime = new Date(props.getShowEnd(show));

        // Log show duration calculation
        console.log(`📺 Live Show Duration:`, {
          title: props.getShowTitle(show),
          start: showStartTime,
          end: showEndTime,
          startFormatted: showStartTime.toLocaleTimeString(),
          endFormatted: showEndTime.toLocaleTimeString(),
          durationHours:
            (showEndTime.getTime() - showStartTime.getTime()) /
            (1000 * 60 * 60),
          crossesMidnight: showEndTime.getTime() < showStartTime.getTime(),
        });

        items.push({
          type: "show",
          id: show.id || `show-${show.name}-${props.getShowStart(show)}`,
          title: props.getShowTitle(show),
          startTime: showStartTime,
          endTime: showEndTime,
          formattedTime: props.formatTimeRange(
            props.getShowStart(show),
            props.getShowEnd(show),
            false
          ),
          date: group.date,
          isLive: props.isLiveShow(show),
        });
      }

      // Add tracks
      if (show.tracks?.length) {
        for (const track of show.tracks) {
          if (!track?.title) continue;

          const startTime = track.starts ? new Date(track.starts) : null;
          const endTime = calculateTrackEndTime(track);

          // Log track processing
          if (startTime) {
            console.log(`🎵 Processing track:`, {
              title: track.title,
              startTime,
              endTime,
              rawStarts: track.starts,
              rawLength: track.length,
              calculatedDuration: endTime
                ? (endTime.getTime() - startTime.getTime()) / 1000 / 60
                : null,
            });
          }

          if (startTime) {
            items.push({
              type: "track",
              id: track.id || `track-${track.title}-${startTime.getTime()}`,
              title: track.title,
              artist: track.artist || track.creator || track.performer || null,
              startTime,
              endTime: endTime || startTime,
              formattedTime: getTrackTimeRange(track),
              date: group.date,
            });
          }
        }
      }
    }

    // Sort by start time and filter by time range (7-24h)
    const filteredItems = items
      .filter((item) => {
        const startHour =
          item.startTime.getHours() + item.startTime.getMinutes() / 60;
        const endHour =
          item.endTime.getHours() + item.endTime.getMinutes() / 60;
        return (
          (startHour >= GRID_START_HOUR && startHour < GRID_END_HOUR) ||
          (endHour > GRID_START_HOUR && startHour < GRID_END_HOUR)
        );
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    itemsByDate.set(dateKey, filteredItems);
  }

  return itemsByDate;
});

// Get items for specific day (now just a lookup)
const getItemsForDay = (date: string | Date): ProcessedItem[] => {
  const dateKey = new Date(date).toDateString();
  return processedItems.value.get(dateKey) || [];
};

// Grid-based position calculation
const getItemGridPosition = (item: ProcessedItem) => {
  const startSegment = timeToGridSegment(item.startTime);
  const durationSegments = calculateItemDurationInSegments(item);

  const gridPosition = {
    gridRowStart: startSegment + 1, // CSS Grid ist 1-indexed
    gridRowEnd: startSegment + durationSegments + 1,
    gridColumn: 1,
  };

  // Debug logging for shows
  if (item.type === "show") {
    console.log(`📍 Grid Position for Show:`, {
      title: item.title,
      startTime: item.startTime.toLocaleTimeString(),
      endTime: item.endTime.toLocaleTimeString(),
      startSegment,
      durationSegments,
      gridRowStart: gridPosition.gridRowStart,
      gridRowEnd: gridPosition.gridRowEnd,
    });
  }

  return gridPosition;
};

// Navigation
const scrollPrev = () => emblaApi.value?.scrollPrev();
const scrollNext = () => emblaApi.value?.scrollNext();
const scrollTo = (index: number) => emblaApi.value?.scrollTo(index);

// Throttled save function
const saveTranslatePositions = useThrottleFn(() => {
  // Implementation if needed
}, 100);

const updateCurrentTime = () => {
  currentTime.value = new Date();
};

// Lifecycle
onMounted(() => {
  if (emblaApi.value) {
    emblaApi.value.on("select", () => {
      currentSlideIndex.value = emblaApi.value?.selectedScrollSnap() || 0;
      canScrollPrev.value = emblaApi.value?.canScrollPrev() || false;
      canScrollNext.value = emblaApi.value?.canScrollNext() || false;
    });
  }

  updateCurrentTime();
  timeUpdateInterval.value = setInterval(updateCurrentTime, 30000);
});

onUnmounted(() => {
  if (timeUpdateInterval.value) {
    clearInterval(timeUpdateInterval.value);
  }
});

// Watch for groups changes
watch(
  () => props.groups,
  () => {
    if (emblaApi.value) {
      emblaApi.value.reInit();
      currentSlideIndex.value = emblaApi.value?.selectedScrollSnap() || 0;
      canScrollPrev.value = emblaApi.value?.canScrollPrev() || false;
      canScrollNext.value = emblaApi.value?.canScrollNext() || false;
    }
  },
  { deep: true }
);
</script>
<template>
  <div class="module-schedule-slider">
    <!-- Navigation Controls -->
    <div class="navigation-controls">
      <!-- Channel Switch -->
      <div class="location-switch">
        <button
          @click="mainStore.setActiveScheduleLocation('channelOne')"
          :class="[
            'location-switch__btn',
            {
              'location-switch__btn--active':
                mainStore.activeScheduleLocation === 'channelOne',
            },
          ]"
        >
          CH1
        </button>
        <button
          @click="mainStore.setActiveScheduleLocation('channelTwo')"
          :class="[
            'location-switch__btn',
            {
              'location-switch__btn--active':
                mainStore.activeScheduleLocation === 'channelTwo',
            },
          ]"
        >
          CH2
        </button>
      </div>

      <!-- Dot Navigation -->
      <div class="dot-navigation">
        <button
          v-for="(_, index) in props.groups"
          :key="`dot-${index}`"
          @click="scrollTo(index)"
          class="dot"
          :class="{ active: currentSlideIndex === index }"
          :aria-label="`Tag ${index + 1} von ${props.groups.length}`"
        />
      </div>

      <!-- Arrow Navigation -->
      <div class="arrow-navigation">
        <button
          @click="scrollPrev"
          class="nav-button prev-button"
          :class="{ disabled: !canScrollPrev }"
          :disabled="!canScrollPrev"
          aria-label="Vorheriger Tag"
        >
          <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
            <path
              d="M1.67986e-07 9.84832L21.1305 0.452866L21.1305 19.2438L1.67986e-07 9.84832Z"
              fill="black"
            />
          </svg>
        </button>

        <button
          @click="scrollNext"
          class="nav-button next-button"
          :class="{ disabled: !canScrollNext }"
          :disabled="!canScrollNext"
          aria-label="Nächster Tag"
        >
          <svg width="22" height="20" viewBox="0 0 22 20" fill="none">
            <path
              d="M22 9.84894L0.86951 19.2444L0.869511 0.453482L22 9.84894Z"
              fill="black"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Schedule Content -->
    <div class="schedule__content">
      <!-- Schedule Slider Column -->
      <div class="schedule__slider-column">
        <!-- Carousel -->
        <section ref="emblaNode" class="embla schedule__city">
          <div
            v-if="props.groups.length > 0"
            class="embla__container show-days"
          >
            <div
              v-for="(group, index) in props.groups"
              :key="`group-${index}`"
              class="show-day embla__slide"
              :class="{
                'show-day--today': group.isToday,
                'embla__slide--active': currentSlideIndex === index,
              }"
            >
              <!-- Day Header -->
              <h3 class="show-day__heading">
                <span v-if="group.isToday" class="today-badge">Today</span>
                {{ props.formatDate(group.date, false) }}
              </h3>

              <!-- Day Content with Time Display and Events -->
              <div class="day-content">
                <!-- Events Column -->
                <div class="day-content__events-column">
                  <!-- Events Grid -->
                  <div class="events">
                    <div class="events-grid">
                      <!-- Current Time Marker - only show for today -->
                      <div
                        v-if="shouldShowTimeMarkerForDate(group.date)"
                        class="current-time-marker"
                        :style="currentTimeIndicatorStyle"
                      >
                        <div class="current-time-marker__pulse" />
                      </div>
                      <!-- Actual Events -->
                      <div
                        v-for="(item, itemIndex) in getItemsForDay(group.date)"
                        :key="`item-${itemIndex}`"
                        class="event-item"
                        :class="{
                          'event-item--show': item.type === 'show',
                          'event-item--track': item.type === 'track',
                          'event-item--live-show':
                            item.type === 'show' && item.isLive,
                        }"
                        :style="getItemGridPosition(item)"
                      >
                        <div
                          class="event-item__content"
                          :class="{ live: item.isLive }"
                        >
                          <h4 class="event-item__time">
                            {{ item.formattedTime }}
                          </h4>
                          <h2 class="event-item__title">
                            <span
                              v-if="item.type === 'show' && item.isLive"
                              class="live-indicator"
                              >LIVE</span
                            >
                            {{ item.title }}
                          </h2>
                          <h3
                            v-if="item.type === 'track' && item.artist"
                            class="event-item__artist"
                          >
                            with&nbsp;{{ item.artist }}
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
<style scoped lang="postcss">
.module-schedule-slider {
  position: relative;
  width: 100%;
  height: max-content;
  /* max-width: calc(var(--page-max-width) + ((100svw - var(--page-max-width)) / 2)); */
  display: flex;
  flex-direction: column;
  max-height: calc(100svh - var(--nav-height));
  overflow-y: scroll;
  overflow-x: hidden;
}

.schedule__content {
  z-index: 10;
  width: 100%;
}

.schedule__slider-column {
  flex-grow: 1;
  width: 100%;
}

.schedule-city {
  width: max-content;
}

.embla {
  height: max-content;
  width: 100%;
  /* max-width: calc(
    var(--page-max-width) + (100vw - var(--page-max-width)) / 2 + 2.75rem
  ); */
  position: relative;
  padding: 0 0 0 calc((100svw - var(--page-max-width)) / 2);


  &__container {
    @apply flex backface-hidden touch-pan-y;
    height: 100%;
    width: max-content;
    margin: 0 0 0 calc(var(--small-padding) * -1);
  }

  &__slide {
    @apply flex flex-grow-0 flex-shrink-0 flex-basis-auto max-w-full min-w-0 relative;

    :deep(img),
    :deep(.video-wrapper) {
      @apply h-[var(--carousel-height)] max-w-full w-auto;
    }
  }
}

.navigation-controls {
  position: sticky;
  top: var(--base-margin);
  @apply flex items-center justify-start flex-row flex-wrap items-stretch;
  gap: 0 var(--mid-padding);
  height: calc(var(--base-font-size) + var(--small-padding) * 2);
  z-index: 999;
  margin: var(--base-margin) 0 var(--base-margin) calc((100svw - var(--page-max-width)) / 2);

}

.location-switch {
  position: relative;
  display: flex;
  align-items: center;
  width: 70px;
  height: calc(var(--base-font-size) + var(--small-padding));
  padding: 4px;
  background: rgba(225, 225, 225, 0.25);
  backdrop-filter: blur(5px);
  border-radius: 30px;
  max-height: calc(var(--base-font-size) + var(--small-padding) * 2);
  height: 100%;

  &__btn {
    flex: 1;
    position: relative;
    z-index: 2;
    height: 100%;
    border: none;
    border-radius: 24px;
    background: transparent;
    color: #555;
    font-weight: 400;
    font-size: var(--small-font-size);
    cursor: pointer;
    transition: color 0.3s ease;
    user-select: none;

    &--active {
      color: #fff;
      background-color: var(--color-pink);
    }

    &:hover:not(&--active) {
      opacity: 0.8;
    }
  }

  /* Der Gleiter */
  &::after {
    content: "";
    position: absolute;
    top: 2px;
    width: calc(50% - 4px);
    max-height: calc(var(--base-font-size) - var(--small-padding) * 2);
    height: 100%;
    background-color: var(--color-pink);
    border-radius: 24px;
    transition: transform 0.3s ease;
    z-index: 1;
  }

  /* Position des Gleiters wenn der zweite Button aktiv ist */
  &:has(
      .location-switch__btn:nth-child(2).location-switch__btn--active
    )::after {
    transform: translateX(calc(100%));
  }
}

.dot-navigation {
  @apply flex items-center;
  gap: 0 var(--small-padding);
  padding: var(--small-padding) var(--base-padding);
  border-radius: 25px;
  background-color: rgba(225, 225, 225, 0.25);
  max-height: calc(var(--base-font-size) + var(--small-padding) * 2);
  backdrop-filter: blur(3px);

  .dot {
    @apply rounded-full transition-colors;
    width: 7px;
    height: 7px;
    background-color: var(--color-grey);

    &.active {
      background-color: var(--color-pink);
    }

    &:hover:not(.active) {
      @media (min-width: 1024px) {
        @apply bg-gray-400;
      }
    }
  }
}

.arrow-navigation {
  @apply flex items-center;
  gap: 0 var(--mid-margin);
  height: calc(var(--base-font-size) + var(--small-padding) * 2);
  padding: 0 var(--small-padding);
  border-radius: 25px;
  background-color: rgba(225, 225, 225, 0.25);
  backdrop-filter: blur(3px);

  .nav-button {
    @apply flex items-center justify-center w-5 h-5 rounded-full bg-transparent transition-all;

    &.disabled {
      @apply opacity-40 cursor-not-allowed;
    }

    svg {
      @apply w-4 h-4;
    }
  }
}

.show-day {
  display: flex;
  flex-flow: column;
  justify-content: flex-start;
  align-items: flex-start;
  flex-grow: 1;

  & > * {
    font-weight: 550;
    text-transform: uppercase;
  }

  &__heading {
    font-size: var(--h4-size);
    color: var(--color-text);
    margin: 0 0 var(--small-padding) var(--small-padding);
    .today-badge {
      color: var(--color-pink);
      text-transform: uppercase;
      margin: 0 var(--small-margin) 0 0;
    }
  }
}

.day-content {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 0;
  width: 100%;

  &__time-column {
    width: var(--big-margin);
    flex-shrink: 0;
    width: 0;
    transition: width 0.125s ease;
  }

  &__events-column {
    flex: 1;
    width: calc(100% - var(--big-margin));
  }
}

.events {
  @apply relative;
  width: clamp(250px, 30svw, 40svh);

  &-grid {
    display: grid;
    grid-template-rows: repeat(
      35,
      var(--schedule-block-height)
    ); /* Maximal 35 half-hour segments - fixed height */
    grid-template-columns: 1fr;
    gap: var(--small-padding); /* No gap for precise grid alignment */
    position: relative;
    padding: 0;
    margin: 0 0 0 var(--small-padding);
  }
}

.event-item {
  background: transparent;
  z-index: 2;
  position: relative;

  &__content {
    background-color: var(--color-grey-transparent);
    padding: var(--small-padding);
    height: 100%;
    border: 1px solid rgba(var(--color-text-rgb), 0.1);
    box-sizing: border-box; /* Ensure padding doesn't affect total height */

    &.live {
      border-color: var(--color-pink);
    }

    @apply flex flex-col;
  }

  & * {
    color: var(--color-text);
    @media (prefers-color-scheme: dark) {
      color: var(--color-bg);
    }
  }

  &--show {
    .event-item__content {
      background-color: rgba(var(--color-pink-rgb), 0.1);
      border: 2px solid var(--color-pink);
      position: relative;
      margin: 0 0 0 0;

      &.live {
        background-color: var(--color-pink);
        border-color: var(--color-pink);
        box-shadow: 0 0 8px rgba(var(--color-pink-rgb), 0.4);
      }
    }
  }

  .live-indicator {
    font-size: var(--small-font-size);
    font-weight: 400;
    color: var(--color-grey);
    margin-right: 4px;
    position: absolute;
    top: var(--small-padding);
    right: var(--small-padding);

    .live & {
      color: white;
    }
  }

  &__time {
    font-size: var(--small-font-size);
    margin: 0 0 calc(var(--small-padding) / 2) 0;
    opacity: 75%;
    line-height: 1.2;
  }

  &__title {
    font-size: var(--h4-size);
    font-weight: 400;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__artist {
    font-size: var(--h4-size);
    font-weight: 400;
    margin-top: calc(var(--small-padding) / 4);
    overflow: hidden;
  }
}

.time-display {
  position: relative;
  width: 100%;
  height: calc(
    35 * var(--schedule-block-height) + 34 * var(--small-padding)
  ); /* Match events-grid height */
}

.current-time-marker {
  z-index: 20;
  pointer-events: none;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  transform: translate(calc(var(--small-padding) * -1), 0);

  &__pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--color-pink);
    position: relative;
    margin-right: var(--small-padding);
    flex-shrink: 0;

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background-color: var(--color-pink);
      transform: translate(-50%, -50%);
      opacity: 0.4;
      animation: pulseOpacity 2s ease-in-out infinite;
      filter: blur(2px);
    }

  }

  &__time {
    font-size: var(--small-font-size);
    color: var(--color-pink);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background-color: var(--color-bg);
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid var(--color-pink);
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(var(--color-pink-rgb), 0.2);
  }
}

@keyframes pulseOpacity {
  0% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(0.8);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scale(0.8);
  }
}
</style>