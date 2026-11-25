<script setup lang="ts">
import {
	entryLabel,
	entrySubline,
	fetchTimetable,
	isLiveEntry,
	scheduleRange,
	type TimetableEntry,
	upcoming,
} from "../../composables/useTimetable";

const entries = ref<TimetableEntry[]>([]);
const now = ref(new Date());
const loaded = ref(false);
const width = ref(0);
const { openPopup } = useTimetableUi();

// More room, more schedule: 4 on a laptop, 5 on a wide screen, 6 on a very
// wide one. Below 900px the list scrolls horizontally instead.
const count = computed(() =>
	width.value >= 1600 ? 6 : width.value >= 1200 ? 5 : 4,
);
// Only entries that have not ended yet: a finished show must disappear as
// soon as the next one starts. The old one-hour lookback kept it on screen.
const cards = computed(() => upcoming(entries.value, count.value, now.value));
const visible = computed(() => loaded.value && cards.value.length > 0);

let clock: ReturnType<typeof setInterval> | null = null;
let boundaryTimer: ReturnType<typeof setTimeout> | null = null;
let requestId = 0;

function measure() {
	width.value = window.innerWidth;
}

function nextBoundary() {
	const at = Date.now();
	let next = Number.POSITIVE_INFINITY;
	for (const entry of entries.value) {
		const start = new Date(entry.startsAt).getTime();
		const end = new Date(entry.endsAt).getTime();
		if (start > at && start < next) next = start;
		if (end > at && end < next) next = end;
	}
	return next;
}

function scheduleBoundary() {
	if (boundaryTimer) clearTimeout(boundaryTimer);
	const next = nextBoundary();
	if (!Number.isFinite(next)) {
		// No future entry in the last payload: retry instead of going silent.
		boundaryTimer = setTimeout(() => void load(true), 60_000);
		return;
	}

	// A long gap still gets a periodic wake-up so a throttled tab, a missed
	// timer or a schedule change cannot leave the strip on an old show.
	const delay = Math.min(Math.max(next - Date.now() + 500, 1000), 5 * 60_000);
	boundaryTimer = setTimeout(async () => {
		if (Date.now() >= next - 500) {
			await load(true);
			return;
		}
		now.value = new Date();
		scheduleBoundary();
	}, delay);
}

async function load(cacheBust = false) {
	const id = ++requestId;
	const payload = await fetchTimetable(undefined, undefined, cacheBust);
	if (id !== requestId) return;
	const nextEntries = payload.entries ?? [];
	if (nextEntries.length > 0 || !loaded.value) {
		entries.value = nextEntries;
		loaded.value = true;
	}
	now.value = new Date();
	scheduleBoundary();
}

function onVisibility() {
	if (document.visibilityState !== "visible") return;
	now.value = new Date();
	void load(true);
}

onMounted(async () => {
	measure();
	window.addEventListener("resize", measure, { passive: true });
	document.addEventListener("visibilitychange", onVisibility);
	await load();
	clock = setInterval(() => {
		now.value = new Date();
	}, 30_000);
});

onBeforeUnmount(() => {
	window.removeEventListener("resize", measure);
	document.removeEventListener("visibilitychange", onVisibility);
	if (clock) clearInterval(clock);
	if (boundaryTimer) clearTimeout(boundaryTimer);
});

function go(entry: TimetableEntry) {
	// The manager's set link points at a manager route (/sets/<id>) that the
	// website does not serve. Until the manager emits a site path, a card opens
	// the schedule popup on that day instead of navigating into a 404.
	openPopup("day", new Date(entry.startsAt).toISOString().slice(0, 10));
}

/** The set that is airing right now, including replays. */
function isCurrent(entry: TimetableEntry): boolean {
	const start = new Date(entry.startsAt).getTime();
	const end = new Date(entry.endsAt).getTime();
	const at = now.value.getTime();
	return start <= at && end > at;
}
</script>

<template>
	<section
		v-if="visible"
		class="timetable-strip"
		aria-label="Schedule around now"
	>
		<div class="timetable-strip__head">
			<span class="timetable-strip__title">
				<span class="timetable-strip__pulse" aria-hidden="true" />
				On air
			</span>
			<button
				type="button"
				class="timetable-strip__more"
				@click="openPopup('day')"
			>
				Full schedule →
			</button>
		</div>
		<ul class="timetable-strip__list">
			<li
				v-for="entry in cards"
				:key="entry.id"
				class="timetable-strip__item"
				:class="{ 'is-live': isLiveEntry(entry), 'is-now': isCurrent(entry) }"
			>
				<button
					type="button"
					class="timetable-strip__card"
					:aria-current="isCurrent(entry) ? 'true' : undefined"
					@click="go(entry)"
				>
					<img
						v-if="entry.cover"
						:src="entry.cover"
						alt=""
						class="timetable-strip__thumb"
						width="44"
						height="44"
						loading="lazy"
					>
					<span class="timetable-strip__copy">
						<span class="timetable-strip__meta">
							<span v-if="isLiveEntry(entry)" class="timetable-strip__live">● LIVE</span>
							<span>{{ scheduleRange(entry) }}</span>
						</span>
						<span class="timetable-strip__name">{{ entryLabel(entry) }}</span>
						<span class="timetable-strip__sub">{{ entrySubline(entry) }}</span>
					</span>
				</button>
			</li>
		</ul>
	</section>
</template>

<style lang="postcss" scoped>
.timetable-strip {
  width: 100%;
  max-width: var(--max-width, 1600px);
  margin: 0 auto;
  padding: calc(var(--small-padding) * 1.5) var(--base-margin) var(--small-padding);
  display: flex;
  flex-flow: column wrap;
  gap: 8px;
  /* The hero gradient is a fixed layer with z-index 0; the strip has to sit
     above it, otherwise the animated colour covers the cards. No background:
     the strip stays transparent and only the cards carry a surface. */
  position: relative;
  z-index: 1;
}

.timetable-strip__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.timetable-strip__title {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: calc(var(--base-font-size) * 0.72);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--color-text) 62%, transparent);
  /* Opacity stays off the container so the pulse dot keeps full strength. */
}

.timetable-strip__pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-pink);
  flex: none;
  animation: timetable-pulse 2s ease-out infinite;
}

@keyframes timetable-pulse {
  0% {
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-pink) 65%, transparent);
  }
  70% {
    box-shadow: 0 0 0 6px transparent;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  .timetable-strip__pulse {
    animation: none;
  }
}

.timetable-strip__more {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font: inherit;
  font-size: calc(var(--base-font-size) * 0.8);
  opacity: 0.6;
  cursor: pointer;
  padding: 0;
}

.timetable-strip__more:hover {
  opacity: 1;
  color: var(--color-pink);
}

.timetable-strip__list {
  list-style: none;
  margin: 0;
  padding: 0 0 4px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
}

.timetable-strip__list::-webkit-scrollbar {
  display: none;
}

.timetable-strip__item {
  flex: 1 1 0;
  min-width: 0;
  scroll-snap-align: start;
}

.timetable-strip__card {
  width: 100%;
  height: 64px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border: 0;
  border-radius: 5px;
  /* A real surface, not a brightness filter on near-black: 8 % of the text
     colour lifts the card off the page in dark mode and lowers it in light. */
  /* Opaque surface: an alpha mix would let the animated hero gradient show
     through and swallow the card. */
  background: color-mix(in srgb, var(--color-text) 10%, var(--color-bg));
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.timetable-strip__card:hover {
  background: color-mix(in srgb, var(--color-text) 16%, var(--color-bg));
}

.timetable-strip__item.is-live .timetable-strip__card {
  background: var(--color-pink);
  color: #1a1013;
}

.timetable-strip__item.is-live .timetable-strip__card:hover {
  background: color-mix(in srgb, #000 8%, var(--color-pink));
}

/* A recorded show that is on air gets a slightly stronger surface: lighter in
   dark mode, darker in light mode. Live shows already carry the pink card. */
.timetable-strip__item.is-now:not(.is-live) .timetable-strip__card {
  background: color-mix(in srgb, var(--color-text) 18%, var(--color-bg));
}

.timetable-strip__item.is-now:not(.is-live) .timetable-strip__card:hover {
  background: color-mix(in srgb, var(--color-text) 24%, var(--color-bg));
}

.timetable-strip__thumb {
  width: 44px;
  height: 44px;
  border-radius: 5px;
  object-fit: cover;
  flex: none;
}

.timetable-strip__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.timetable-strip__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: calc(var(--base-font-size) * 0.64);
  opacity: 0.7;
  font-variant-numeric: tabular-nums;
}

.timetable-strip__live {
  font-weight: 600;
  letter-spacing: 0.06em;
}

.timetable-strip__name {
  font-size: calc(var(--base-font-size) * 0.86);
  font-weight: 550;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.timetable-strip__sub {
  font-size: calc(var(--base-font-size) * 0.7);
  opacity: 0.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 900px) {
  .timetable-strip__item {
    flex: 0 0 78vw;
    min-width: 0;
  }
}
</style>
