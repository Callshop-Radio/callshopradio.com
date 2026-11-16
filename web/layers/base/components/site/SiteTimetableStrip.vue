<script setup lang="ts">
import {
	aroundNow,
	entryLabel,
	entrySubline,
	fetchTimetable,
	scheduleRange,
	scheduleTime,
	type TimetableEntry,
} from "../../composables/useTimetable";

const entries = ref<TimetableEntry[]>([]);
const loaded = ref(false);
const { openPopup } = useTimetableUi();

const cards = computed(() => aroundNow(entries.value, new Date(), 3).slice(0, 6));
const visible = computed(() => loaded.value && cards.value.length > 0);

onMounted(async () => {
	const payload = await fetchTimetable();
	entries.value = payload.entries ?? [];
	loaded.value = true;
});

function go(entry: TimetableEntry) {
	const target = entry.setPath || entry.showPath;
	if (target) navigateTo(target);
}
</script>

<template>
	<section
		v-if="visible"
		class="timetable-strip"
		aria-label="Schedule around now"
	>
		<div class="timetable-strip__head">
			<span class="timetable-strip__title">On the air</span>
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
				:class="{ 'is-live': entry.onAir }"
			>
				<button
					type="button"
					class="timetable-strip__card"
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
							<span v-if="entry.onAir" class="timetable-strip__live">● LIVE</span>
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
}

.timetable-strip__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.timetable-strip__title {
  font-size: calc(var(--base-font-size) * 0.72);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
  opacity: 0.55;
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
  flex: 0 0 min(280px, 78vw);
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
  background: var(--color-bg);
  filter: brightness(1.18);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.timetable-strip__card:hover {
  filter: brightness(1.3);
}

.timetable-strip__item.is-live .timetable-strip__card {
  background: var(--color-pink);
  color: #1a1013;
  filter: none;
}

.timetable-strip__thumb {
  width: 44px;
  height: 44px;
  border-radius: 4px;
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
</style>
