<script setup lang="ts">
import {
	entryLabel,
	entrySubline,
	fetchTimetable,
	isLiveEntry,
	scheduleTime,
	type TimetableEntry,
	upcoming,
} from "../../composables/useTimetable";

const open = ref(false);
const entries = ref<TimetableEntry[]>([]);
const { openPopup, open: panelOpen } = useTimetableUi();

// In the player the trigger sits at the bottom of the viewport, so the panel
// has to open upwards instead of below the button.
const props = withDefaults(
	defineProps<{
		placement?: "bottom" | "top";
		mode?: "dropdown" | "panel";
	}>(),
	{ placement: "bottom", mode: "dropdown" },
);

const root = ref<HTMLElement | null>(null);
const list = ref<HTMLElement | null>(null);
const trigger = ref<HTMLButtonElement | null>(null);

const items = computed(() => upcoming(entries.value, 8));

async function load() {
	const payload = await fetchTimetable();
	entries.value = payload.entries ?? [];
}

function toggle() {
	// In the player the schedule opens as a chat-sized panel, not as a dropdown
	// that the player's stacking context would clip.
	if (props.mode === "panel") {
		openPopup("day");
		return;
	}
	open.value = !open.value;
	if (open.value) {
		void load();
		nextTick(() => list.value?.querySelector<HTMLElement>("button")?.focus());
	}
}

function close() {
	open.value = false;
}

function expand() {
	close();
	openPopup("day");
}

function go(entry: TimetableEntry) {
	// Same rule as the strip: no manager route, open the day in the popup.
	close();
	openPopup("day", new Date(entry.startsAt).toISOString().slice(0, 10));
}

function onDocumentClick(event: MouseEvent) {
	if (!open.value) return;
	const target = event.target as Node | null;
	if (target && root.value?.contains(target)) return;
	close();
}

onMounted(() => document.addEventListener("click", onDocumentClick));
onBeforeUnmount(() => document.removeEventListener("click", onDocumentClick));
</script>

<template>
	<div ref="root" class="tt-popover">
		<button
			ref="trigger"
			type="button"
			class="tt-popover__trigger"
			:class="{ 'is-active': props.mode === 'panel' && panelOpen }"
			aria-haspopup="dialog"
			:aria-expanded="open"
			aria-label="Schedule"
			data-tooltip="Schedule"
			@click.stop="toggle"
		>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
				<circle cx="12" cy="12" r="11.5" stroke="var(--color-text)" />
				<path
					d="M16.7143 6.91667H15.4286V6.45833C15.4286 6.20624 15.2357 6 15 6C14.7643 6 14.5714 6.20624 14.5714 6.45833V6.91667H9.42857V6.45833C9.42857 6.20624 9.23572 6 9 6C8.76428 6 8.57143 6.20624 8.57143 6.45833V6.91667H7.28571C6.57858 6.91667 6 7.53542 6 8.29167V15.625C6 16.3812 6.57858 17 7.28571 17H16.7143C17.4214 17 18 16.3812 18 15.625V8.29167C18 7.53542 17.4214 6.91667 16.7143 6.91667ZM6.85714 8.29167C6.85714 8.03958 7.04999 7.83333 7.28571 7.83333H8.57143V8.29167C8.57143 8.54376 8.76428 8.75 9 8.75C9.23572 8.75 9.42857 8.54376 9.42857 8.29167V7.83333H14.5714V8.29167C14.5714 8.54376 14.7643 8.75 15 8.75C15.2357 8.75 15.4286 8.54376 15.4286 8.29167V7.83333H16.7143C16.95 7.83333 17.1429 8.03958 17.1429 8.29167V9.66667H6.85714V8.29167ZM17.1429 15.625C17.1429 15.8771 16.95 16.0833 16.7143 16.0833H7.28571C7.04999 16.0833 6.85714 15.8771 6.85714 15.625V10.5833H17.1429V15.625Z"
					fill="var(--color-text)"
				/>
			</svg>
		</button>

		<div v-if="open" class="tt-popover__panel" :class="{ 'is-top': props.placement === 'top' }" role="dialog" aria-label="Schedule">
			<div class="tt-popover__head">
				<span class="tt-popover__title">Schedule</span>
				<button type="button" class="tt-popover__expand" aria-label="Open full schedule" @click="expand">
					<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
						<path d="M6 2H2v4M10 14h4v-4M14 6V2h-4M2 10v4h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
					</svg>
				</button>
			</div>

			<ul ref="list" class="tt-popover__list">
				<li v-for="entry in items" :key="entry.id">
					<button
						type="button"
						class="tt-popover__item"
						:class="{ 'is-live': isLiveEntry(entry) }"
						@click="go(entry)"
					>
						<img
							v-if="entry.cover"
							:src="entry.cover"
							alt=""
							class="tt-popover__thumb"
							width="28"
							height="28"
							loading="lazy"
						>
						<span class="tt-popover__copy">
							<span class="tt-popover__meta">
								<span v-if="isLiveEntry(entry)" class="tt-popover__live">● LIVE</span>
								<span>{{ scheduleTime(entry.startsAt) }}</span>
							</span>
							<span class="tt-popover__name">{{ entryLabel(entry) }}</span>
							<span class="tt-popover__sub">{{ entrySubline(entry) }}</span>
						</span>
					</button>
				</li>
				<li v-if="items.length === 0" class="tt-popover__empty">Nothing scheduled.</li>
			</ul>

			<button type="button" class="tt-popover__foot" @click="expand">
				Open full schedule
			</button>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.tt-popover {
  position: relative;
  display: inline-flex;
}

.tt-popover__trigger {
  appearance: none;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.tt-popover__trigger circle {
  transition: stroke 0.15s ease;
}

.tt-popover__trigger:hover circle {
  stroke: var(--color-pink);
}

.tt-popover__trigger.is-active circle {
  stroke: var(--color-pink);
  fill: var(--color-pink);
}

.tt-popover__trigger.is-active path {
  fill: var(--color-bg);
}

.tt-popover__panel {
  position: absolute;
  /* Clears the fixed player row that now sits under the navigation. */
  top: calc(100% + 10px + var(--player-bar-height));
  right: 0;
  width: 340px;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  border-radius: 5px;
  box-shadow: 0 18px 48px rgb(0 0 0 / 45%);
  overflow: hidden;
  z-index: 60;
}

.tt-popover__panel.is-top {
  top: auto;
  bottom: calc(100% + 10px);
}

.tt-popover__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 6px;
}

.tt-popover__title {
  font-size: calc(var(--base-font-size) * 0.76);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.55;
}

.tt-popover__expand {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--color-text);
  opacity: 0.75;
  cursor: pointer;
  padding: 4px;
  border-radius: 5px;
  display: grid;
  place-items: center;
}

.tt-popover__expand:hover {
  opacity: 1;
  color: var(--color-pink);
}

.tt-popover__list {
  list-style: none;
  margin: 0;
  padding: 0 6px;
  overflow-y: auto;
}

.tt-popover__item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 7px 6px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
}

.tt-popover__item:hover,
.tt-popover__item:focus-visible {
  background: color-mix(in srgb, var(--color-text) 7%, transparent);
  outline: none;
}

.tt-popover__item.is-live {
  background: var(--color-pink);
  color: #1a1013;
}

.tt-popover__thumb {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  object-fit: cover;
  flex: none;
}

.tt-popover__copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.tt-popover__meta {
  display: flex;
  gap: 6px;
  font-size: calc(var(--base-font-size) * 0.62);
  opacity: 0.65;
  font-variant-numeric: tabular-nums;
}

.tt-popover__live {
  font-weight: 600;
  letter-spacing: 0.05em;
}

.tt-popover__name {
  font-size: calc(var(--base-font-size) * 0.82);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tt-popover__sub {
  font-size: calc(var(--base-font-size) * 0.68);
  opacity: 0.55;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tt-popover__empty {
  padding: 14px 10px;
  opacity: 0.5;
  font-size: calc(var(--base-font-size) * 0.78);
}

.tt-popover__foot {
  appearance: none;
  border: 0;
  border-top: 1px solid color-mix(in srgb, var(--color-text) 8%, transparent);
  background: transparent;
  color: var(--color-text);
  padding: 10px 12px;
  text-align: left;
  font: inherit;
  font-size: calc(var(--base-font-size) * 0.78);
  opacity: 0.7;
  cursor: pointer;
}

.tt-popover__foot:hover {
  opacity: 1;
  color: var(--color-pink);
}

@media (max-width: 900px) {
  .tt-popover__panel {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-height: 60vh;
    border-radius: 5px 5px 0 0;
  }
}
</style>
