<script setup lang="ts">
import {
	entryLabel,
	entrySubline,
	fetchTimetable,
	isLiveEntry,
	minutesOfDay,
	scheduleDay,
	scheduleRange,
	scheduleTime,
	type TimetableEntry,
	type TimetablePayload,
} from "../../composables/useTimetable";

const { open, view, day, closePopup, openPopup, expanded, expand } = useTimetableUi();

const payload = ref<TimetablePayload | null>(null);
const loading = ref(false);
const panel = ref<HTMLElement | null>(null);
const scroller = ref<HTMLElement | null>(null);

const HOUR = 68;
const now = ref(new Date());
let clock: ReturnType<typeof setInterval> | null = null;

const views = [
	{ id: "day", label: "Day" },
	{ id: "week", label: "Week" },
	{ id: "month", label: "Month" },
] as const;

const anchor = computed(() => {
	if (!day.value) return new Date();
	const parsed = new Date(`${day.value}T12:00:00`);
	return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
});

// When the chat is open, the timetable takes the slot to its left instead of
// stacking on top of it.
const chatUi = useChatUi();
const chatOpen = computed(() => chatUi.open.value && !chatUi.minimized.value);

function startOfDay(date: Date) {
	const copy = new Date(date);
	copy.setHours(0, 0, 0, 0);
	return copy;
}

function mondayOf(date: Date) {
	const copy = startOfDay(date);
	const shift = (copy.getDay() + 6) % 7;
	copy.setDate(copy.getDate() - shift);
	return copy;
}

function windowFor() {
	const base = anchor.value;
	if (view.value === "week") {
		const from = mondayOf(base);
		const to = new Date(from);
		to.setDate(to.getDate() + 7);
		return { from, to };
	}
	if (view.value === "month") {
		const from = new Date(base.getFullYear(), base.getMonth(), 1);
		const to = new Date(base.getFullYear(), base.getMonth() + 1, 1);
		return { from, to };
	}
	const from = startOfDay(base);
	const to = new Date(from);
	to.setDate(to.getDate() + 1);
	return { from, to };
}

let requestId = 0;

function localDateKey(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

async function load() {
	const id = ++requestId;
	loading.value = true;
	const { from, to } = windowFor();
	const next = await fetchTimetable(from.toISOString(), to.toISOString());
	// A slower reply from the previous view must not overwrite the current one.
	if (id !== requestId) return;
	payload.value = next;
	loading.value = false;
}

const entries = computed(() => payload.value?.entries ?? []);

const dayEntries = computed(() =>
	[...entries.value].sort(
		(a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
	),
);

const weekDays = computed(() => {
	const start = mondayOf(anchor.value);
	return Array.from({ length: 7 }, (_, index) => {
		const date = new Date(start);
		date.setDate(date.getDate() + index);
		const key = date.toDateString();
		return {
			date,
			label: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(
				date,
			),
			number: date.getDate(),
			entries: dayEntries.value.filter(
				(entry) => new Date(entry.startsAt).toDateString() === key,
			),
			isToday: date.toDateString() === new Date().toDateString(),
		};
	});
});

const monthCells = computed(() => {
	const base = anchor.value;
	const first = new Date(base.getFullYear(), base.getMonth(), 1);
	const offset = (first.getDay() + 6) % 7;
	const start = new Date(first);
	start.setDate(start.getDate() - offset);
	return Array.from({ length: 42 }, (_, index) => {
		const date = new Date(start);
		date.setDate(date.getDate() + index);
		const key = date.toDateString();
		return {
			date,
			inMonth: date.getMonth() === base.getMonth(),
			isToday: key === new Date().toDateString(),
			entries: dayEntries.value.filter(
				(entry) => new Date(entry.startsAt).toDateString() === key,
			),
		};
	});
});

const nowTop = computed(
	() => ((now.value.getHours() * 60 + now.value.getMinutes()) / 60) * HOUR,
);

// The entry that is running right now gets a subtle highlight, distinct from a
// real live show (which stays pink).
function isRunning(entry: TimetableEntry) {
	const start = new Date(entry.startsAt).getTime();
	const end = new Date(entry.endsAt).getTime();
	const at = now.value.getTime();
	return at >= start && at < end;
}

// The time indicator belongs to today only. On any other day it would claim a
// "now" that does not exist there.
const anchorIsToday = computed(
	() => anchor.value.toDateString() === new Date().toDateString(),
);
const weekHasToday = computed(() => weekDays.value.some((dayItem) => dayItem.isToday));

function top(entry: TimetableEntry) {
	const minutes = minutesOfDay(entry.startsAt);
	return (minutes / 60) * HOUR;
}

function height(entry: TimetableEntry) {
	const start = minutesOfDay(entry.startsAt);
	const end = minutesOfDay(entry.endsAt);
	const span = end <= start ? end + 1440 - start : end - start;
	return Math.max(24, (span / 60) * HOUR - 3);
}

function setView(next: "day" | "week" | "month") {
	view.value = next;
}

function shift(direction: number) {
	const base = new Date(anchor.value);
	if (view.value === "month") base.setMonth(base.getMonth() + direction);
	else if (view.value === "week") base.setDate(base.getDate() + direction * 7);
	else base.setDate(base.getDate() + direction);
	day.value = localDateKey(base);
}

function go(entry: TimetableEntry) {
	// `/sets/<id>` is a manager route; the website has no such page. Only a
	// real show path navigates, everything else keeps the popup open.
	if (entry.showPath) {
		closePopup();
		navigateTo(entry.showPath);
	}
}

function onKey(event: KeyboardEvent) {
	if (event.key === "Escape") closePopup();
}

watch([view, () => day.value], () => {
	if (open.value) void load();
});

watch(open, async (value) => {
	if (value) {
		document.body.style.overflow = "hidden";
		await load();
		nextTick(() => {
			panel.value?.focus();
			if (view.value === "day" && scroller.value) {
				scroller.value.scrollTop = Math.max(0, nowTop.value - 160);
			}
		});
	} else {
		document.body.style.overflow = "";
	}
});

onMounted(() => {
	window.addEventListener("keydown", onKey);
	clock = setInterval(() => {
		now.value = new Date();
	}, 30_000);

	// Deep link: /?schedule=popup&view=week&day=2026-11-16 opens the popup.
	const route = useRoute();
	if (route.query.schedule === "popup") {
		const nextView = route.query.view;
		const nextDay = route.query.day;
		openPopup(
			nextView === "week" || nextView === "month" ? nextView : "day",
			typeof nextDay === "string" && nextDay ? nextDay : null,
		);
	}
});

onBeforeUnmount(() => {
	window.removeEventListener("keydown", onKey);
	document.body.style.overflow = "";
	if (clock) clearInterval(clock);
});
</script>

<template>
	<Teleport to="body">
		<div v-if="open" class="tt-popup" :class="{ 'is-shifted': chatOpen, 'is-expanded': expanded }" @click.self="closePopup">
			<section
				ref="panel"
				class="tt-popup__panel"
				role="dialog"
				aria-modal="true"
				aria-label="Schedule"
				tabindex="-1"
			>
				<header class="tt-popup__head">
					<div class="tt-popup__nav">
						<button type="button" class="tt-popup__arrow" aria-label="Previous" @click="shift(-1)">&#8592;</button>
						<button type="button" class="tt-popup__arrow" aria-label="Next" @click="shift(1)">&#8594;</button>
						<strong class="tt-popup__date">{{ scheduleDay((day ? `${day}T12:00:00` : new Date().toISOString())) }}</strong>
					</div>
					<div v-if="expanded" class="tt-popup__views" role="group" aria-label="View">
						<button
							v-for="item in views"
							:key="item.id"
							type="button"
							class="tt-popup__view"
							:class="{ 'is-on': view === item.id }"
							:aria-pressed="view === item.id"
							@click="setView(item.id)"
						>
							{{ item.label }}
						</button>
					</div>
					<div class="tt-popup__actions">
						<button
							v-if="!expanded"
							type="button"
							class="tt-popup__expand"
							aria-label="Expand schedule"
							@click="expand"
						>
							<span>Expand</span>
							<svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
								<path d="M6 2H2v4M10 14h4v-4M14 6V2h-4M2 10v4h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
							</svg>
						</button>
						<button type="button" class="tt-popup__close" aria-label="Close" @click="closePopup">&#10005;</button>
					</div>
				</header>

				<div ref="scroller" class="tt-popup__body">
					<p v-if="loading" class="tt-popup__hint">Loading scheduleâ€¦</p>

					<!-- DAY -->
					<div v-else-if="view === 'day'" class="tt-day">
						<div class="tt-day__hours" aria-hidden="true">
							<span v-for="hour in 24" :key="hour" :style="{ top: ((hour - 1) * HOUR) + 'px' }">
								{{ String(hour - 1).padStart(2, "0") }}
							</span>
						</div>
						<div class="tt-day__lane" :style="{ height: (24 * HOUR) + 'px' }">
							<div v-if="anchorIsToday" class="tt-day__now" :style="{ top: nowTop + 'px' }"><span>{{ scheduleTime(now.toISOString()) }}</span></div>
							<button
								v-for="entry in dayEntries"
								:key="entry.id"
								type="button"
								class="tt-day__event"
								:class="{ 'is-live': isLiveEntry(entry), 'is-now': isRunning(entry), 'is-past': new Date(entry.endsAt) < now, 'is-tight': height(entry) < 46, 'is-notumb': !entry.cover }"
								:style="{ top: top(entry) + 'px', height: height(entry) + 'px' }"
								@click="go(entry)"
							>
								<img v-if="entry.cover" :src="entry.cover" alt="" class="tt-day__thumb" loading="lazy">
								<span class="tt-day__copy">
									<span class="tt-day__row">
										<span class="tt-day__title">{{ entryLabel(entry) }}</span>
										<span class="tt-day__time">{{ scheduleRange(entry) }}</span>
									</span>
									<span class="tt-day__sub">{{ entrySubline(entry) }}</span>
									<span v-if="entry.genres?.length" class="tt-day__tags">
										<span v-for="genre in entry.genres.slice(0, 3)" :key="genre">{{ genre }}</span>
									</span>
								</span>
								<span v-if="isLiveEntry(entry)" class="tt-day__live">LIVE</span>
							</button>
							<p v-if="dayEntries.length === 0" class="tt-popup__hint">Nothing scheduled.</p>
						</div>
					</div>

					<!-- WEEK -->
					<div v-else-if="view === 'week'" class="tt-week">
						<div class="tt-week__head">
							<span />
							<span v-for="dayItem in weekDays" :key="dayItem.label" :class="{ 'is-today': dayItem.isToday }">
								{{ dayItem.label }} <strong>{{ dayItem.number }}</strong>
							</span>
						</div>
						<div class="tt-week__grid">
							<div class="tt-week__hours" aria-hidden="true">
								<span v-for="hour in 24" :key="hour" :style="{ top: ((hour - 1) * HOUR) + 'px' }">
									{{ String(hour - 1).padStart(2, "0") }}
								</span>
							</div>
							<div
								v-for="dayItem in weekDays"
								:key="dayItem.label + dayItem.number"
								class="tt-week__col"
								:style="{ height: (24 * HOUR) + 'px' }"
							>
								<button
									v-for="entry in dayItem.entries"
									:key="entry.id"
									type="button"
									class="tt-week__event"
									:class="{ 'is-live': isLiveEntry(entry), 'is-past': new Date(entry.endsAt) < now, 'is-notumb': !entry.cover }"
									:style="{ top: top(entry) + 'px', height: height(entry) + 'px' }"
									@click="go(entry)"
								>
									<span class="tt-week__time">{{ scheduleTime(entry.startsAt) }}</span>
									<span class="tt-week__title">{{ entryLabel(entry) }}</span>
								</button>
							</div>
							<div v-if="weekHasToday" class="tt-week__now" :style="{ top: nowTop + 'px' }" />
						</div>
					</div>

					<!-- MONTH -->
					<div v-else class="tt-month">
						<div class="tt-month__head">
							<span v-for="label in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="label">{{ label }}</span>
						</div>
						<div class="tt-month__grid">
							<div
								v-for="cell in monthCells"
								:key="cell.date.toISOString()"
								class="tt-month__cell"
								:class="{ 'is-out': !cell.inMonth, 'is-today': cell.isToday }"
							>
								<span class="tt-month__num">{{ cell.date.getDate() }}</span>
								<button
									v-for="entry in cell.entries"
									:key="entry.id"
									type="button"
									class="tt-month__pill"
									:class="{ 'is-live': isLiveEntry(entry) }"
									@click="go(entry)"
								>
									{{ scheduleTime(entry.startsAt) }} {{ entryLabel(entry) }}
								</button>
								<span v-if="cell.entries.length === 0 && cell.inMonth" class="tt-month__empty">â€”</span>
							</div>
						</div>
					</div>
				</div>

				<footer class="tt-popup__foot">
					<span>Timezone in Berlin ({{ payload?.timezoneLabel || "GMT+1" }})</span>
					<span>Now: {{ scheduleTime(now.toISOString()) }}</span>
				</footer>
			</section>
		</div>
	</Teleport>
</template>

<style lang="postcss" scoped>
.tt-popup {
  position: fixed;
  right: 1.5rem;
  bottom: calc(1.5rem + var(--player-bar-height));
  z-index: 1000;
  display: block;
  width: max-content;
  padding: 0;
  background: transparent;
}

.tt-popup.is-shifted {
  right: calc(1.5rem + 24rem + 0.75rem);
}

/* Expanded: the same component becomes the full schedule view. */
.tt-popup.is-expanded {
  inset: 0;
  right: auto;
  bottom: auto;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgb(0 0 0 / 62%);
}

.tt-popup.is-expanded .tt-popup__panel {
  width: min(980px, 92vw);
  height: min(780px, 90vh);
}

.tt-popup__actions {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tt-popup__expand {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--color-text);
  opacity: 0.75;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font: inherit;
  font-size: calc(var(--base-font-size) * 0.72);
}

.tt-popup__expand:hover {
  opacity: 1;
  color: var(--color-pink);
}

.tt-popup__panel {
  width: min(24rem, calc(100vw - 2rem));
  height: min(34rem, calc(100vh - var(--player-bar-height) - 7rem));
  display: grid;
  grid-template-rows: auto 1fr auto;
  background: var(--color-bg);
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 24px 70px rgb(0 0 0 / 55%);
  outline: none;
}

.tt-popup__head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
}

.tt-popup__nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tt-popup__arrow {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--color-text);
  opacity: 0.55;
  font-size: 16px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.tt-popup__arrow:hover { opacity: 1; color: var(--color-pink); }

.tt-popup__date {
  font-size: calc(var(--base-font-size) * 0.86);
  font-weight: 550;
  margin-left: 4px;
}

.tt-popup__views {
  margin-left: auto;
  display: flex;
  gap: 2px;
}.tt-popup__view {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--color-text);
  opacity: 0.55;
  font: inherit;
  font-size: calc(var(--base-font-size) * 0.76);
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.tt-popup__view.is-on {
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
  opacity: 1;
}

.tt-popup__close {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--color-text);
  opacity: 0.55;
  cursor: pointer;
  font-size: 14px;
  padding: 6px;
  border-radius: 4px;
}

.tt-popup__close:hover { opacity: 1; }

.tt-popup__body {
  overflow: auto;
  padding: 4px 16px 12px;
  position: relative;
}

.tt-popup__hint {
  opacity: 0.5;
  font-size: calc(var(--base-font-size) * 0.78);
  padding: 12px 0;
}

/* DAY */
.tt-day {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 0;
}

.tt-day__hours,
.tt-week__hours {
  position: relative;
}

.tt-day__hours span,
.tt-week__hours span {
  position: absolute;
  left: 0;
  width: 38px;
  text-align: right;
  font-size: 10px;
  color: var(--color-text);
  opacity: 0.45;
  transform: translateY(-6px);
  font-variant-numeric: tabular-nums;
}

.tt-day__lane {
  position: relative;
  border-left: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  background-image: repeating-linear-gradient(to bottom, color-mix(in srgb, var(--color-text) 7%, transparent) 0 1px, transparent 1px 68px);
}

.tt-day__now {
  position: absolute;
  left: 0;
  right: 0;
  height: 0;
  border-top: 1px solid var(--color-pink);
  z-index: 1;
}

.tt-day__now span {
  position: absolute;
  left: -44px;
  top: -7px;
  width: 38px;
  text-align: right;
  font-size: 9px;
  color: var(--color-pink);
  font-variant-numeric: tabular-nums;
}

.tt-day__now::before {
  content: "";
  position: absolute;
  left: -4px;
  top: -4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-pink);
}

.tt-day__event {
  position: absolute;
  left: 6px;
  right: 4px;
  z-index: 2;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  gap: 11px;
  align-items: start;
  padding: 9px 12px;
  border: 0;
  border-radius: 5px;
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
}

.tt-day__event:hover { background: color-mix(in srgb, var(--color-text) 11%, transparent); }
.tt-day__event.is-past { opacity: 0.42; }
/* Running now: one step brighter than the normal card (darker in light mode). */
.tt-day__event.is-now {
  background: color-mix(in srgb, var(--color-text) 17%, transparent);
}
.tt-day__event.is-live { background: var(--color-pink); color: #1a1013; }
.tt-day__event.is-tight { grid-template-columns: minmax(0, 1fr) auto; padding: 4px 8px; }
/* No cover means no thumbnail column: without this the copy would slide into
   the 44 px image track and wrap into a narrow column. */
.tt-day__event.is-notumb { grid-template-columns: minmax(0, 1fr) auto; }
.tt-day__event.is-tight .tt-day__thumb,
.tt-day__event.is-tight .tt-day__tags,
.tt-day__event.is-tight .tt-day__sub { display: none; }

.tt-day__thumb {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  object-fit: cover;
}

.tt-day__copy { min-width: 0; display: flex; flex-direction: column; gap: 2px; }

.tt-day__row { display: flex; align-items: baseline; gap: 8px; min-width: 0; }

.tt-day__title {
  font-size: calc(var(--base-font-size) * 0.92);
  font-weight: 550;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tt-day__time {
  margin-left: auto;
  font-size: calc(var(--base-font-size) * 0.66);
  opacity: 0.6;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.tt-day__sub {
  font-size: calc(var(--base-font-size) * 0.7);
  opacity: 0.6;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tt-day__tags {
  display: flex;
  gap: 7px;
  font-size: calc(var(--base-font-size) * 0.62);
  opacity: 0.55;
}

.tt-day__tags span + span::before { content: "Â·"; margin-right: 7px; }

.tt-day__live {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 2px 6px;
  border-radius: 4px;
  background: #1a1013;
  color: var(--color-pink);
}

/* WEEK */
.tt-week__head {
  display: grid;
  grid-template-columns: 44px repeat(7, 1fr);
  gap: 0;
  padding-bottom: 6px;
}

.tt-week__head span {
  text-align: center;
  font-size: 10px;
  opacity: 0.55;
}

.tt-week__head span strong { font-size: 12px; opacity: 1; }

.tt-week__head span.is-today strong { color: var(--color-pink); }

.tt-week__grid {
  display: grid;
  grid-template-columns: 44px repeat(7, 1fr);
  position: relative;
}

.tt-week__col {
  position: relative;
  border-left: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
  background-image: repeating-linear-gradient(to bottom, color-mix(in srgb, var(--color-text) 6%, transparent) 0 1px, transparent 1px 68px);
}

.tt-week__event {
  position: absolute;
  left: 2px;
  right: 2px;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 6px;
  border: 0;
  border-radius: 5px;
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
}

.tt-week__event.is-past { opacity: 0.4; }
.tt-week__event.is-notumb { grid-template-columns: minmax(0, 1fr); }
.tt-week__event.is-live { background: var(--color-pink); color: #1a1013; }

.tt-week__time { font-size: 9px; opacity: 0.6; font-variant-numeric: tabular-nums; }
.tt-week__title { font-size: 10.5px; font-weight: 550; }

.tt-week__now {
  position: absolute;
  left: 44px;
  right: 0;
  height: 1px;
  background: var(--color-pink);
  z-index: 1;
}

/* MONTH */
.tt-month__head {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  padding-bottom: 4px;
}

.tt-month__head span {
  font-size: 10px;
  opacity: 0.5;
  text-align: center;
}

.tt-month__grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1px;
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
  border-radius: 5px;
  overflow: hidden;
}

.tt-month__cell {
  min-width: 0;
  min-height: 112px;
  padding: 7px 8px;
  background: var(--color-bg);
  display: flex;
  flex-direction: column;
  gap: 3px;
  overflow: hidden;
}

.tt-month__cell.is-out { opacity: 0.3; }
.tt-month__cell.is-today .tt-month__num { color: var(--color-pink); font-weight: 600; }

.tt-month__num {
  font-size: 10px;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}

.tt-month__pill {
  appearance: none;
  border: 0;
  border-radius: 4px;
  background: color-mix(in srgb, var(--color-text) 7%, transparent);
  color: var(--color-text);
  font: inherit;
  font-size: 9px;
  text-align: left;
  padding: 1px 4px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  min-width: 0;
}

.tt-month__pill.is-live { background: var(--color-pink); color: #1a1013; font-weight: 550; }

.tt-month__empty { font-size: 10px; opacity: 0.25; }

.tt-popup__foot {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 9px 16px;
  font-size: calc(var(--base-font-size) * 0.66);
  opacity: 0.5;
}

@media (max-width: 900px) {
  .tt-popup {
    right: 0;
    bottom: 0;
  }

  .tt-popup__panel {
    width: 100vw;
    height: 100vh;
    border-radius: 0;
  }
}
</style>

