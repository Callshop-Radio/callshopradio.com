<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import emblaCarouselVue from "embla-carousel-vue";
import { useThrottleFn } from "@vueuse/core";
import { useMainStore } from "~/stores/mainStore";

// Store einbinden
const mainStore = useMainStore();

interface Group {
  date: string | Date;
  shows: any[];
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

const {
  groups,
  formatDate,
  getShowTitle,
  getShowStart,
  getShowEnd,
  formatTimeRange,
  getShowDescription,
  isLiveShow,
} = props;

const [emblaNode, emblaApi] = emblaCarouselVue({
  align: "start",
  containScroll: false,
});

const emblaContainer = ref<HTMLElement>();

let containerStyle: string;

const saveTranslatePositions = useThrottleFn(() => {
  if (!emblaContainer.value) return;
  containerStyle = emblaContainer.value.style.transform;
}, 100);

async function restoreTranslatePositions() {
  if (!emblaContainer.value) return;
  emblaContainer.value.style.transform = containerStyle;
}

// Funktion zur Berechnung der Endzeit eines Tracks
const calculateTrackEndTime = (track) => {
  if (!track.starts || !track.length) return null;

  const startTime = new Date(track.starts);

  // Verarbeite den length-Wert (kann verschiedene Formate haben)
  const lengthParts = track.length.split(":");
  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (lengthParts.length === 3) {
    // Format: "Stunden:Minuten:Sekunden"
    hours = parseInt(lengthParts[0], 10);
    minutes = parseInt(lengthParts[1], 10);
    seconds = parseFloat(lengthParts[2]);
  } else if (lengthParts.length === 2) {
    // Format: "Minuten:Sekunden"
    minutes = parseInt(lengthParts[0], 10);
    seconds = parseFloat(lengthParts[1]);
  }

  // Addiere Stunden, Minuten und Sekunden zum Startdatum
  const endTime = new Date(startTime.getTime());
  endTime.setHours(endTime.getHours() + hours);
  endTime.setMinutes(endTime.getMinutes() + minutes);
  endTime.setSeconds(endTime.getSeconds() + Math.floor(seconds));

  return endTime;
};

// Funktion zur Formatierung der Uhrzeiten für Tracks mit Aufrundung auf volle Stunden// Funktion zur Formatierung der Uhrzeiten für Tracks mit Aufrundung auf volle Stunden
const formatTrackTime = (dateTime) => {
  // Überprüfen, ob dateTime ein gültiges Datum ist
  if (!dateTime || !(dateTime instanceof Date) || isNaN(dateTime.getTime())) {
    return "";
  }

  // Kopie des Datums erstellen, um das Original nicht zu verändern
  const roundedTime = new Date(dateTime);

  // Wenn Minuten > 0, zur nächsten vollen Stunde aufrunden
  if (roundedTime.getMinutes() > 0) {
    roundedTime.setHours(roundedTime.getHours() + 1);
  }

  // Minuten und Sekunden auf 0 setzen (volle Stunde)
  roundedTime.setMinutes(0);
  roundedTime.setSeconds(0);
  roundedTime.setMilliseconds(0);

  // Formatieren als "HH:00"
  const hours = roundedTime.getHours().toString().padStart(2, "0");

  return `${hours}:00`;
};

// Funktion zur Berechnung und Formatierung des Zeitbereichs eines Tracks
const getTrackTimeRange = (track) => {
  if (!track.starts) return "";

  const startTime = new Date(track.starts);
  const endTime = calculateTrackEndTime(track);

  // Prüfen, ob die Zeiten gültig sind
  const startFormatted = formatTrackTime(startTime);

  // Wenn keine Endzeit verfügbar ist oder die Berechnung fehlschlägt, nur Startzeit zurückgeben
  if (!endTime) return startFormatted;

  const endFormatted = formatTrackTime(endTime);

  // Nur einen vollständigen String zurückgeben, wenn beide Teile vorhanden sind
  return `${startFormatted} - ${endFormatted}`;
};

// Neue Funktion zum Flatten der Shows und Tracks
const flattenShowsAndTracks = computed(() => {
  if (!groups || groups.length === 0) return [];

  const flattened = [];

  // Durch alle Gruppen (Tage) iterieren
  for (const group of groups) {
    const date = group.date;

    // Durch alle Shows des Tages iterieren
    for (const show of group.shows) {
      // Show als Eintrag hinzufügen - aber nur wenn description "live" ist
      const description = getShowDescription(show);
      if (description && description.toLowerCase() === "live") {
        flattened.push({
          type: "show",
          id: show.id || `show-${show.name}-${getShowStart(show)}`,
          title: getShowTitle(show),
          startTime: getShowStart(show),
          endTime: getShowEnd(show),
          description: description,
          formattedTime: formatTimeRange(
            getShowStart(show),
            getShowEnd(show),
            false
          ),
          date: date,
          isLive: isLiveShow(show),
          rawData: show,
        });
      }

      // Wenn Show Tracks hat, diese auch als Einträge hinzufügen
      if (show.tracks && show.tracks.length > 0) {
        for (const track of show.tracks) {
          // Überprüfen, ob der Track gültige Daten enthält
          if (!track || !track.title) continue;

          const startTime = track.starts ? new Date(track.starts) : null;
          const endTime = calculateTrackEndTime(track);

          // Nur den Track-Titel verwenden, ohne Künstlernamen
          const trackTitle = track.title || "Unbekannter Titel";

          flattened.push({
            type: "track",
            id: track.id || `track-${trackTitle}-${Date.now()}`,
            title: trackTitle, // Nur den Titel ohne Künstlernamen
            startTime: startTime,
            endTime: endTime,
            formattedTime: getTrackTimeRange(track),
            parentShowId: show.id || `show-${show.name}-${getShowStart(show)}`,
            date: date,
            rawData: track,
          });
        }
      }
    }
  }

  // Nach Startzeit sortieren
  return flattened.sort((a, b) => {
    const timeA =
      a.type === "track" && a.startTime
        ? a.startTime.getTime()
        : new Date(a.startTime).getTime();
    const timeB =
      b.type === "track" && b.startTime
        ? b.startTime.getTime()
        : new Date(b.startTime).getTime();
    return timeA - timeB;
  });
});
// Referenz für den aktuellen Slide-Index
const currentSlideIndex = ref(0);
// Anzahl der Slides
const slideCount = computed(() => groups.length);

// Navigationsroutinen
const scrollPrev = () => {
  emblaApi.value?.scrollPrev();
};

const scrollNext = () => {
  emblaApi.value?.scrollNext();
};

// Springe zu einem bestimmten Slide
const scrollTo = (index) => {
  emblaApi.value?.scrollTo(index);
};

// Prüfen, ob das Scrollen zurück möglich ist
const canScrollPrev = ref(false);
// Prüfen, ob das Scrollen vorwärts möglich ist
const canScrollNext = ref(true);

onMounted(() => {
  if (emblaApi.value) {
    emblaApi.value.on("scroll", saveTranslatePositions);
    emblaApi.value.on("destroy", restoreTranslatePositions);

    // Index-Updates und Scroll-Limitierungen
    emblaApi.value.on("select", () => {
      currentSlideIndex.value = emblaApi.value?.selectedScrollSnap() || 0;
      canScrollPrev.value = emblaApi.value?.canScrollPrev() || false;
      canScrollNext.value = emblaApi.value?.canScrollNext() || false;
    });
  }
  updateCurrentTime();
  timeUpdateInterval.value = setInterval(updateCurrentTime, 30000); // Jede Minute aktualisieren
});

// Cleanup beim Unmounten
onUnmounted(() => {
  if (timeUpdateInterval.value) {
    clearInterval(timeUpdateInterval.value);
  }
});

// Funktion zum Aktualisieren der aktuellen Zeit
const updateCurrentTime = () => {
  currentTime.value = new Date();
};

// Watch auf Änderungen der groups zum Re-Initialisieren der Embla-Instanz
watch(
  () => groups,
  () => {
    if (emblaApi.value) {
      emblaApi.value.reInit();
      // Nach Re-Init den Status aktualisieren
      currentSlideIndex.value = emblaApi.value?.selectedScrollSnap() || 0;
      canScrollPrev.value = emblaApi.value?.canScrollPrev() || false;
      canScrollNext.value = emblaApi.value?.canScrollNext() || false;
    }
  },
  { deep: true }
);

// Funktion zum Filtern der Items für einen bestimmten Tag
const getItemsForDay = (date) => {
  return flattenShowsAndTracks.value.filter((item) => {
    // Prüfen, ob das Datum übereinstimmt
    const isSameDate =
      new Date(item.date).toDateString() === new Date(date).toDateString();

    if (!isSameDate) return false;

    // Start- und Endzeit als Date-Objekte
    const startDate =
      item.type === "track" && item.startTime
        ? item.startTime
        : new Date(item.startTime);

    const endDate =
      item.type === "track" && item.endTime
        ? item.endTime
        : new Date(item.endTime);

    // Stunde als Zahl (0-23)
    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    const endHour = endDate.getHours() + endDate.getMinutes() / 60;

    // Prüfen, ob die Show innerhalb des Zeitfensters 8:00 - 0:00 Uhr liegt
    // Entweder beginnt sie nach 8 Uhr, oder sie endet nach 8 Uhr und beginnt vor Mitternacht
    return (
      (startHour >= 8 && startHour < 24) || (endHour > 8 && startHour < 24)
    );
  });
};

// Funktion zum Berechnen der Position und Größe eines Items im Grid
const getItemPositionStyle = (item) => {
  // Start- und Endzeit als Date-Objekte
  const startDate =
    item.type === "track" && item.startTime
      ? item.startTime
      : new Date(item.startTime);

  const endDate =
    item.type === "track" && item.endTime
      ? item.endTime
      : new Date(item.endTime);

  // Stunde als Zahl (0-23)
  const startHour = startDate.getHours() + startDate.getMinutes() / 60;
  const endHour = endDate.getHours() + endDate.getMinutes() / 60;

  // Begrenzung auf unseren Zeitbereich (8-24 Uhr)
  const gridStartHour = 8;
  const gridEndHour = 24;

  // Position berechnen (relativ zum Start des Grids)
  const startPosition = Math.max(0, startHour - gridStartHour);
  const endPosition = Math.min(
    gridEndHour - gridStartHour,
    endHour - gridStartHour
  );

  // Länge des Items
  const duration = endPosition - startPosition;

  // CSS-Positionen berechnen (in Prozent)
  const top = (startPosition / (gridEndHour - gridStartHour)) * 100;
  const height = (duration / (gridEndHour - gridStartHour)) * 100;

  // Sicherstellen, dass die Elemente eine Mindesthöhe haben
  const minHeight = 4; // Prozent

  return {
    top: `calc(${top}%)`,
    height: `calc(${Math.max(height, minHeight)}%)`,
    backgroundColor: `#d9d9d9`
  };
};

const currentTime = ref(new Date());
const timeUpdateInterval = ref(null);

// Formatierte aktuelle Uhrzeit (HH:MM)
const formattedCurrentTime = computed(() => {
  const hours = currentTime.value.getHours().toString().padStart(2, "0");
  const minutes = currentTime.value.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
});

// Position des aktuellen Zeitmarkers berechnen
const currentTimePosition = computed(() => {
  const now = currentTime.value;
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Stunde als Dezimalzahl (z.B. 14.5 für 14:30)
  const decimalHour = hours + minutes / 60;

  // Position in Prozent berechnen (relativ zum Zeitfenster 8-24 Uhr)
  const gridStartHour = 8;
  const gridEndHour = 24;

  // Wenn außerhalb des sichtbaren Zeitraums, nicht anzeigen
  if (decimalHour < gridStartHour || decimalHour >= gridEndHour) {
    return { display: "none" };
  }

  // Position berechnen (in Prozent)
  const position =
    ((decimalHour - gridStartHour) / (gridEndHour - gridStartHour)) * 100;

  return {
    top: `${position}%`,
  };
});
</script>
<template>
  <div clas="module-schedule-slider">
    <div class="navigation-controls">
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
      <div class="dot-navigation">
        <button
          v-for="(_, index) in groups"
          :key="'dot-' + index"
          @click="scrollTo(index)"
          class="dot"
          :class="{ active: currentSlideIndex === index }"
          :aria-label="`Tag ${index + 1} von ${groups.length}`"
        ></button>
      </div>
      <div class="arrow-navigation">
        <button
          @click="scrollPrev"
          class="nav-button prev-button"
          :class="{ disabled: !canScrollPrev }"
          :disabled="!canScrollPrev"
          aria-label="Vorheriger Tag"
        >
          <svg
            width="22"
            height="20"
            viewBox="0 0 22 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
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
          <svg
            width="22"
            height="20"
            viewBox="0 0 22 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22 9.84894L0.86951 19.2444L0.869511 0.453482L22 9.84894Z"
              fill="black"
            />
          </svg>
        </button>
      </div>
    </div>
    <!-- Zeitmarkierungen -->
    <div class="time-markers__container">
      <div class="time-markers">
        <div v-for="hour in 17" :key="'hour-' + hour" class="time-marker">
          {{ String(7 + hour).padStart(2, "0") }}:00
        </div>
        <!-- Neuer aktueller Zeitmarker -->
        <div class="current-time-marker" :style="currentTimePosition">
          <div class="current-time-marker__pulse"></div>
        </div>
      </div>
    </div>
    <section ref="emblaNode" class="embla schedule__city">
      <div
        v-if="groups.length >= 0"
        ref="emblaContainer"
        class="embla__container show-days"
      >
        <div
          v-for="(group, index) in groups"
          :key="'group-' + index"
          class="show-day embla__slide"
          :class="{ 'show-day--today': group.isToday }"
        >
          <h3 class="show-day__heading">
            <span v-if="group.isToday" class="today-badge">Heute</span
            >{{ formatDate(group.date, false) }}
          </h3>

          <!-- Zeitraster für 08:00 - 00:00 Uhr -->
          <div class="events">
            <!-- Grid für Shows und Tracks -->
            <div class="events-grid">
              <template
                v-for="(item, itemIndex) in getItemsForDay(group.date)"
                :key="'item-' + itemIndex"
              >
                <div
                  class="event-item"
                  :class="{
                    'event-item--show': item.type === 'show',
                    'event-item--track': item.type === 'track',
                  }"
                  :style="getItemPositionStyle(item)"
                >
                  <div class="event-item__content">
                    <div class="event-item__time">{{ item.formattedTime }}</div>
                    <div class="event-item__title">{{ item.title }}</div>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped lang="postcss">
.embla {
  @apply overflow-hidden;

  &__container {
    @apply flex backface-hidden ml-[calc(var(--carousel-spacing)*-1)] touch-pan-y;
  }

  &__slide {
    @apply flex flex-grow-0 flex-shrink-0 flex-basis-auto max-w-full min-w-0 pl-[var(--carousel-spacing)] relative;

    :deep(img),
    :deep(.video-wrapper) {
      @apply h-[var(--carousel-height)] max-w-full w-auto;
    }
  }
}

.navigation-controls {
  @apply flex items-center justify-start flex-row flex-wrap items-stretch;
  gap: 0 var(--mid-padding);
  height: calc(var(--base-font-size) + var(--small-padding) * 2);
  margin: var(--base-margin) 0;
}

.location-switch {
  position: relative;
  display: flex;
  align-items: center;
  width: 70px;
  height: calc(var(--base-font-size) + var(--small-padding) * 2);
  padding: 4px;
  border: 4px solid #eaeaea;
  border-radius: 30px;

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

    &--active {
      color: #fff;
    }

    &:hover:not(&--active) {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }

  /* Der Gleiter */
  &::after {
    content: "";
    position: absolute;
    top: 2px;
    width: calc(50% - 4px);
    height: calc(100% - 4px);
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
  background-color: rgba(225, 225, 225, 0.8);
  max-height: calc(var(--base-font-size) + var(--small-padding) * 2);

  .dot {
    @apply rounded-full transition-colors;
    width: 7px;
    height: 7px;
    background-color: var(--color-grey);

    &.active {
      background-color: var(--color-pink);
    }

    &:hover:not(.active) {
      @apply bg-gray-400;
    }
  }
}

.arrow-navigation {
  @apply flex items-center;
  gap: 0 var(--mid-margin);
  height: calc(var(--base-font-size) + var(--small-padding) * 2);
  padding: 0 var(--small-padding);
  border-radius: 25px;
  background-color: rgba(225, 225, 225, 0.8);

  .nav-button {
    @apply flex items-center justify-center w-5 h-5 rounded-full bg-transparent transition-all shadow-sm hover:shadow hover:border-gray-300;

    &.disabled {
      @apply opacity-40 cursor-not-allowed hover:shadow-none hover:border-gray-200;
    }

    svg {
      @apply w-4 h-4;
    }
  }
}

.show-day {
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: flex-start;
}

.time-markers__container {
  position: absolute;
  transform: translate(calc(-100% - var(--base-padding)), 0);
  margin: calc(var(--h3-size) + var(--base-padding) + var(--small-padding)) 0 0;
  height: 150vh;
  display: flex;
  .time-markers {
    @apply text-gray-400;
    font-size: var(--small-font-size);
    width: 50px;
    position: relative;
    height: 100%;

    .time-marker {
      @apply absolute w-full text-right pr-2;
      height: 20px;
      margin: var(--base-padding) 0 0 0;

      &:nth-child(1) {
        top: 0%;
      }
      &:nth-child(2) {
        top: 6.25%;
      }
      &:nth-child(3) {
        top: 12.5%;
      }
      &:nth-child(4) {
        top: 18.75%;
      }
      &:nth-child(5) {
        top: 25%;
      }
      &:nth-child(6) {
        top: 31.25%;
      }
      &:nth-child(7) {
        top: 37.5%;
      }
      &:nth-child(8) {
        top: 43.75%;
      }
      &:nth-child(9) {
        top: 50%;
      }
      &:nth-child(10) {
        top: 56.25%;
      }
      &:nth-child(11) {
        top: 62.5%;
      }
      &:nth-child(12) {
        top: 68.75%;
      }
      &:nth-child(13) {
        top: 75%;
      }
      &:nth-child(14) {
        top: 81.25%;
      }
      &:nth-child(15) {
        top: 87.5%;
      }
      &:nth-child(16) {
        top: 93.75%;
      }
      &:nth-child(17) {
        top: 100%;
      }
    }
  }
}

/* Aktueller Zeitmarker mit verbessertem Pulsieren */
.current-time-marker {
  position: absolute;
  display: flex;
  align-items: center;
  height: 20px;
  width: 100%;
  z-index: 5;

  &__pulse {
    position: absolute;
    width: 10px;
    height: 10px;
    right: var(--base-padding);
    border-radius: 50%;
    background-color: var(--color-pink);
    z-index: 2;

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      width: var(--base-margin);
      height: var(--mid-margin);
      border-radius: 50%;
      background-color: var(--color-pink);
      transform: translate(-50%, -50%);
      z-index: 1;
      opacity: 0.8;
      animation: pulseOpacity 2s ease-in-out infinite;
      filter: blur(5px);
    }
  }

  &__line {
    position: absolute;
    width: calc(100% + 100vw);
    height: 2px;
    right: -12px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--color-pink) 50%,
      rgba(238, 82, 155, 0.7)
    );
  }

  &__time {
    position: absolute;
    right: 16px;
    background: var(--color-pink);
    color: white;
    font-size: var(--small-font-size);
    font-weight: bold;
    padding: 2px 6px;
    border-radius: 4px;
    transform: translateY(-50%);
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

/* Zeitraster */
.events {
  @apply relative;
  margin-top: var(--base-padding);
  height: 150vh;
  display: flex;
  width: clamp(400px, 33svw, 50svh);

  .events-grid {
    @apply flex-grow relative;
    display: flex;
    flex-flow: column wrap;
    gap: var(--base-padding) 0;
  }
}

/* Event Items */
.event-item {
  @apply absolute rounded shadow-sm overflow-hidden;
  background: white;
  min-height: 24px;
  padding: var(--small-padding) var(--small-padding) 0 var(--small-padding);
  width: calc(100% - 20px);
  z-index: 1;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    /* transform: scale(1.02); */
    /* box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); */
    /* z-index: 2; */
  }

  &--show {
    @apply bg-gray-50 border-l-4 border-blue-500;
  }

  &--track {
    @apply bg-white border border-gray-200 border-l-4 border-l-green-400;
  }

  &__content {
    @apply flex flex-col overflow-hidden;
    height: 100%;
  }

  &__time {
    @apply text-gray-500 text-xs;
  }

  &__title {
    @apply font-medium text-sm truncate;
  }
}
</style>