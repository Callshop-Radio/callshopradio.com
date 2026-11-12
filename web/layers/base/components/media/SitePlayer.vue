<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { usePlayerStore } from "~/stores/playerStore";
import { usePlayerAnalytics } from "~~/layers/base/composables/usePlayerAnalytics";
import { usePlayerController } from "~~/layers/base/composables/usePlayerController";
import {
	formatPlayerTime,
	scheduleShowProgress,
	streamShowProgress,
} from "~~/layers/base/utils/player";

interface PlayerLink {
	label: string;
	path: string | null;
}

const store = usePlayerStore();
const controller = usePlayerController();
const analytics = usePlayerAnalytics();
const localePath = useLocalePath();
const playerRef = ref<HTMLElement | null>(null);

const isSet = computed(() => store.mode === "set" && Boolean(store.set));
const tracklistOpen = ref(false);
const nowMs = ref(Date.now());
let progressClock: ReturnType<typeof setInterval> | null = null;

const scheduleWindow = computed(() => {
	const feed = store.feed;
	if (feed?.state !== "auto" || feed.progress) return null;
	return store.schedule;
});
const scheduleProgress = computed(() =>
	scheduleShowProgress(scheduleWindow.value, nowMs.value),
);
const scheduledShow = computed(() =>
	scheduleProgress.value ? scheduleWindow.value : null,
);

watch(isSet, (value) => {
	if (value) tracklistOpen.value = false;
});

watch(
	[
		() => store.mode,
		() => store.set?.id,
		() => store.set?.title,
		() => store.set?.cover,
		() => store.feed?.title,
		() => store.feed?.subtitle,
		() => store.feed?.cover,
		() => store.feed?.track?.title,
		() => store.playing,
	],
	() => controller.syncMediaSession(),
	{ immediate: true },
);

const streamTitle = computed<PlayerLink>(() => {
	const value = store.feed;
	if (!value) return { label: "Callshop Radio", path: null };
	if (value.set?.title) return { label: value.set.title, path: value.set.path };
	if (value.show?.title)
		return { label: value.show.title, path: value.show.path };
	if (scheduledShow.value)
		return { label: scheduledShow.value.name, path: "/schedule" };
	return {
		label: value.title,
		path: value.state === "auto" && value.progress ? "/schedule" : null,
	};
});

const streamLinks = computed<PlayerLink[]>(() => {
	const value = store.feed;
	if (!value) return [];
	const links: PlayerLink[] = [];
	if (value.show?.title)
		links.push({ label: value.show.title, path: value.show.path });
	for (const artist of value.artists)
		links.push({ label: artist.name, path: artist.path });
	if (!links.length && value.subtitle)
		links.push({ label: value.subtitle, path: null });
	return links;
});

const setTitle = computed<PlayerLink>(() => {
	const value = store.set;
	if (!value) return { label: "Callshop Radio", path: null };
	const path =
		value.path ||
		(value.slug && value.show?.slug
			? `/shows/${value.show.slug}/${value.slug}`
			: null);
	return { label: value.title || "Set", path };
});

const setLinks = computed<PlayerLink[]>(() => {
	const value = store.set;
	if (!value) return [];
	const links: PlayerLink[] = [];
	if (value.show?.title) {
		links.push({
			label: value.show.title,
			path:
				value.show.path ||
				(value.show.slug ? `/shows/${value.show.slug}` : null),
		});
	}
	for (const artist of value.artists) {
		links.push({
			label: artist.name,
			path: artist.path || (artist.slug ? `/pool/${artist.slug}` : null),
		});
	}
	return links;
});

const cover = computed(
	() => (isSet.value ? store.set?.cover : store.feed?.cover) || null,
);
const coverLink = computed(() => {
	const path = isSet.value
		? setTitle.value.path
		: store.feed?.set?.path || store.feed?.show?.path || null;
	return path ? localePath(path) : null;
});
const statusLabel = computed(() => {
	if (isSet.value) return "Set";
	if (scheduledShow.value) return "Sendeplan";
	if (store.feed?.state === "auto" && store.feed?.progress) return "Sendeplan";
	switch (store.feed?.state) {
		case "live":
			return "Live";
		case "replay":
			return "Replay";
		case "auto":
			return "AutoDJ";
		case "offline":
			return "Offline";
		default:
			return "Radio";
	}
});
const isLive = computed(() => !isSet.value && store.feed?.state === "live");
const progressPercent = computed(() => {
	const value = store.progress;
	if (!value || value.durationMs <= 0) return 0;
	return Math.min(
		100,
		Math.max(0, (value.positionMs / value.durationMs) * 100),
	);
});
const progressTime = computed(() => {
	const value = store.progress;
	if (!value) return "";
	return `${formatPlayerTime(value.positionMs / 1000)} / ${formatPlayerTime(
		value.durationMs / 1000,
	)}`;
});
const progressTimeWidth = computed(() => {
	const value = store.progress;
	const durationMs = value?.durationMs ?? store.set?.durationMs ?? 0;
	if (durationMs <= 0) return null;
	const longest = formatPlayerTime(durationMs / 1000);
	return `${longest.length * 2 + 3}ch`;
});
const streamProgress = computed(
	() => scheduleProgress.value ?? streamShowProgress(store.feed, nowMs.value),
);
const streamEndLabel = computed(() => {
	const value = streamProgress.value;
	if (!value) return "";
	const time = new Date(value.endMs).toLocaleTimeString("de-DE", {
		hour: "2-digit",
		minute: "2-digit",
	});
	return `Bis ${time}`;
});

function seek(event: MouseEvent) {
	const target = event.currentTarget as HTMLElement | null;
	if (!target) return;
	const rect = target.getBoundingClientRect();
	if (rect.width > 0) controller.seek((event.clientX - rect.left) / rect.width);
}

function onKeydown(event: KeyboardEvent) {
	if (event.key !== "Escape" || !isSet.value || tracklistOpen.value) return;
	const target = event.target as Node | null;
	if (target && playerRef.value?.contains(target)) controller.closeSet();
}

onMounted(() => {
	analytics.start();
	window.addEventListener("keydown", onKeydown);
	progressClock = window.setInterval(() => {
		nowMs.value = Date.now();
	}, 10_000);
});

onBeforeUnmount(() => {
	analytics.stop();
	window.removeEventListener("keydown", onKeydown);
	if (progressClock) window.clearInterval(progressClock);
});
</script>

<template>
	<section
		ref="playerRef"
		class="site-player"
		:class="{ 'is-set': isSet, 'is-live': isLive }"
		role="region"
		aria-label="Player"
	>
		<button
			type="button"
			class="site-player__play"
			:aria-label="store.playing ? 'Pause' : 'Abspielen'"
			:aria-pressed="store.playing"
			@click="controller.toggle()"
		>
			<span v-if="store.loading" class="site-player__dots" aria-hidden="true">
				<span /><span /><span />
			</span>
			<svg
				v-else-if="store.playing"
				class="site-player__pause"
				width="28"
				height="28"
				viewBox="0 0 65 65"
				fill="none"
				aria-hidden="true"
			>
				<circle class="site-player__disc" cx="32.17" cy="32.17" r="32.17" />
				<rect class="site-player__bar" x="21.5" y="19.5" width="7" height="26" rx="1.5" />
				<rect class="site-player__bar" x="36.5" y="19.5" width="7" height="26" rx="1.5" />
			</svg>
			<svg
				v-else
				class="site-player__play-icon"
				width="28"
				height="28"
				viewBox="0 0 65 65"
				fill="none"
				aria-hidden="true"
			>
				<circle class="site-player__disc" cx="32.17" cy="32.17" r="32.17" />
				<path
					class="site-player__triangle"
					d="M50.56 32.17L22.98 48.09V16.25L50.56 32.17Z"
				/>
			</svg>
		</button>

		<Transition name="site-player-cover" mode="out-in">
			<NuxtLink
				v-if="cover && coverLink"
				:key="cover"
				:to="coverLink"
				class="site-player__cover-link"
				aria-label="Set öffnen"
				@click.stop
			>
				<img class="site-player__cover" :src="cover" alt="" loading="lazy" />
			</NuxtLink>
			<img
				v-else-if="cover"
				:key="cover"
				class="site-player__cover"
				:src="cover"
				alt=""
				loading="lazy"
			/>
		</Transition>

		<div class="site-player__viewport">
			<div class="site-player__layer site-player__layer--stream" :aria-hidden="isSet" :inert="isSet">
				<div class="site-player__meta">
					<div class="site-player__title">
						<NuxtLink
							v-if="streamTitle.path"
							:to="localePath(streamTitle.path)"
							@click.stop
						>
							{{ streamTitle.label }}
						</NuxtLink>
						<span v-else>{{ streamTitle.label }}</span>
					</div>
					<div v-if="streamLinks.length" class="site-player__sub">
						<template v-for="(link, index) in streamLinks" :key="`${link.label}-${index}`">
							<span v-if="index" class="site-player__separator" aria-hidden="true">·</span>
							<NuxtLink v-if="link.path" :to="localePath(link.path)" @click.stop>
								{{ link.label }}
							</NuxtLink>
							<span v-else>{{ link.label }}</span>
						</template>
					</div>
				</div>
				<div class="site-player__side">
					<button
						v-if="store.feed?.tracklist?.length"
						type="button"
						class="site-player__icon"
						:aria-expanded="tracklistOpen"
						aria-controls="player-tracklist"
						aria-label="Live-Tracklist"
						@pointerdown.stop
						@click.stop="tracklistOpen = !tracklistOpen"
					>
						☰
					</button>
					<span v-if="streamEndLabel" class="site-player__until">{{ streamEndLabel }}</span>
					<span class="site-player__status">
						<span class="site-player__dot" :class="{ 'is-live': isLive }" aria-hidden="true" />
						<span>{{ statusLabel }}</span>
					</span>
				</div>
			</div>

			<div class="site-player__layer site-player__layer--set" :aria-hidden="!isSet" :inert="!isSet">
				<div class="site-player__meta">
					<div class="site-player__title">
						<NuxtLink v-if="setTitle.path" :to="localePath(setTitle.path)" @click.stop>
							{{ setTitle.label }}
						</NuxtLink>
						<span v-else>{{ setTitle.label }}</span>
					</div>
					<div v-if="setLinks.length" class="site-player__sub">
						<template v-for="(link, index) in setLinks" :key="`${link.label}-${index}`">
							<span v-if="index" class="site-player__separator" aria-hidden="true">·</span>
							<NuxtLink v-if="link.path" :to="localePath(link.path)" @click.stop>
								{{ link.label }}
							</NuxtLink>
							<span v-else>{{ link.label }}</span>
						</template>
					</div>
				</div>
				<PlayerWaveform
					v-if="store.waveform"
					class="site-player__waveform"
					:samples="store.waveform.samples"
					:height="store.waveform.height"
					:progress="progressPercent / 100"
					:position-ms="store.progress?.positionMs ?? 0"
					:duration-ms="store.progress?.durationMs ?? store.set?.durationMs ?? 0"
					@seek="controller.seek"
				/>
				<div class="site-player__side">
					<a
						v-if="store.set?.soundcloudPageUrl"
						class="site-player__source"
						:href="store.set.soundcloudPageUrl"
						target="_blank"
						rel="noopener"
						@click.stop
					>
						SoundCloud
					</a>
					<span
						v-if="progressTime"
						class="site-player__time"
						:style="progressTimeWidth ? { width: progressTimeWidth } : undefined"
					>{{ progressTime }}</span>
					<ElementsHeartButton
						v-if="store.set?.id"
						:set-id="store.set.id"
						variant="inline"
						class="site-player__heart"
					/>
					<button
						type="button"
						class="site-player__close"
						aria-label="Set schließen"
						@click.stop="controller.closeSet()"
					>
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<circle cx="12" cy="12" r="11.5" stroke="currentColor" />
							<path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" />
						</svg>
					</button>
				</div>
			</div>
		</div>

		<div
			v-if="!isSet && streamProgress"
			class="site-player__progress site-player__progress--passive"
			role="progressbar"
			aria-label="Show-Fortschritt"
			aria-valuemin="0"
			aria-valuemax="100"
			:aria-valuenow="Math.round(streamProgress.percent)"
			:aria-valuetext="`${Math.round(streamProgress.percent)} %`"
		>
			<span :style="{ transform: `scaleX(${streamProgress.percent / 100})` }" />
		</div>

		<button
			v-else-if="isSet && !store.waveform"
			type="button"
			class="site-player__progress"
			aria-label="Im Set springen"
			@click="seek"
		>
			<span :style="{ transform: `scaleX(${progressPercent / 100})` }" />
		</button>

		<PlayerTracklist
			v-if="tracklistOpen && store.feed?.tracklist?.length"
			id="player-tracklist"
			:tracks="store.feed?.tracklist ?? []"
			@close="tracklistOpen = false"
		/>

		<p v-if="store.error" class="site-player__error" role="status">
			<span>{{ store.error }}</span>
			<button v-if="isSet" type="button" @click="controller.retrySet()">Erneut versuchen</button>
		</p>
	</section>
</template>

<style lang="postcss" scoped>
.site-player {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  max-width: var(--page-max-width);
  height: 56px;
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
  background-color: var(--color-bg);

  @media screen and (max-width: 1100px) {
    padding: 0 var(--base-padding);
  }

  @media screen and (max-width: 900px) {
    gap: 0.5rem;
  }
}

.site-player__play {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid var(--color-pink);
    outline-offset: 2px;
  }

  .site-player__play-icon,
  .site-player__pause {
    width: 28px;
    height: 28px;
  }

  .site-player__disc {
    fill: var(--color-grey);
    transition: fill 160ms ease;
  }

  .site-player__triangle,
  .site-player__bar {
    fill: var(--color-black);
  }

  &:hover .site-player__disc {
    fill: var(--color-pink);
  }
}

.site-player__dots {
  display: flex;
  align-items: center;
  gap: 2px;

  span {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--color-pink);
    animation: site-player-dot 1.2s infinite ease-in-out;

    &:nth-child(2) {
      animation-delay: 0.15s;
    }

    &:nth-child(3) {
      animation-delay: 0.3s;
    }
  }
}

@keyframes site-player-dot {
  0%, 80%, 100% { opacity: 0.35; }
  40% { opacity: 1; }
}

.site-player__cover-link {
  display: block;
  width: 36px;
  height: 36px;
  flex: none;
  border-radius: 4px;
  overflow: hidden;

  .site-player__cover {
    width: 100%;
    height: 100%;
  }

  @media screen and (max-width: 900px) {
    width: 40px;
    height: 40px;
  }
}

.site-player__cover {
  width: 36px;
  height: 36px;
  flex: none;
  border-radius: 4px;
  object-fit: cover;
  background: var(--color-grey);

  @media screen and (max-width: 900px) {
    width: 40px;
    height: 40px;
  }
}

.site-player__viewport {
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.site-player__layer {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition:
    transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
    opacity 180ms ease;
}

.site-player__layer--stream {
  transform: translateX(0);
  opacity: 1;
}

.site-player__layer--set {
  transform: translateX(16px);
  opacity: 0;
  pointer-events: none;
}

.site-player.is-set {
  .site-player__layer--stream {
    transform: translateX(-12px);
    opacity: 0;
    pointer-events: none;
  }

  .site-player__layer--set {
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
  }
}

.site-player__waveform {
  flex: 1;
  min-width: 0;
}

.site-player__layer--set .site-player__meta {
  flex: 0 1 auto;
  max-width: 36%;
}

.site-player__meta {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 0.125rem;
}

.site-player__title {
  overflow: hidden;
  font-family: var(--font-text-semibold);
  font-size: var(--base-font-size);
  line-height: 1.2;
  white-space: nowrap;
  text-overflow: ellipsis;

  a {
    color: inherit;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      text-decoration: underline;
    }
  }
}

.site-player__sub {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  overflow: hidden;
  color: var(--color-dark-grey);
  font-size: var(--small-font-size);
  line-height: 1.2;
  white-space: nowrap;
  text-overflow: ellipsis;

  a {
    color: inherit;
    text-decoration: none;

    &:hover,
    &:focus-visible {
      text-decoration: underline;
    }
  }
}

.site-player__separator {
  flex: none;
  opacity: 0.7;
}

.site-player__side {
  display: flex;
  flex: none;
  align-items: center;
  gap: 0.5rem;
}

.site-player__status {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-dark-grey);
  font-size: 0.625rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.site-player__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-dark-grey);

  &.is-live {
    background: var(--color-pink);
  }
}

.site-player__time {
  flex: none;
  color: var(--color-dark-grey);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

.site-player__until {
  flex: none;
  color: var(--color-dark-grey);
  font-size: 0.625rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.site-player__heart {
  display: inline-flex;
  color: var(--color-dark-grey);

  :deep(.heart__button) {
    width: 44px;
    height: 44px;
  }

  @media screen and (max-width: 900px) {
    :deep(.heart__button) {
      width: 40px;
      height: 40px;
    }
  }
}

.site-player__close {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-dark-grey);
  cursor: pointer;
  opacity: 0.72;
  transition:
    color 160ms ease,
    opacity 160ms ease;

  svg {
    width: 22px;
    height: 22px;
  }

  &:hover {
    background: transparent;
    color: var(--color-text);
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid var(--color-pink);
    outline-offset: 2px;
    opacity: 1;
  }
}

.site-player__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    background: var(--color-grey);
  }

  &:focus-visible {
    outline: 2px solid var(--color-pink);
    outline-offset: 2px;
  }
}

.site-player__progress {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;

  span {
    display: block;
    height: 100%;
    background: var(--color-pink);
    transform-origin: left;
  }
}

.site-player__progress--passive {
  background: color-mix(in srgb, var(--color-dark-grey) 26%, transparent);
  cursor: default;
  pointer-events: none;
}

.site-player__source {
  color: var(--color-dark-grey);
  font-size: 0.625rem;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    text-decoration: underline;
  }
}

.site-player__error {
  position: absolute;
  right: 0;
  bottom: 2px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  color: var(--color-dark-grey);
  font-size: 0.625rem;

  button {
    padding: 0.125rem 0.5rem;
    border: 1px solid currentColor;
    border-radius: 100px;
    background: transparent;
    color: inherit;
    font-size: inherit;
    cursor: pointer;
  }

  @media screen and (max-width: 1100px) {
    right: var(--base-padding);
  }
}

.site-player-cover-enter-active,
.site-player-cover-leave-active {
  transition: opacity 200ms ease;
}

.site-player-cover-enter-from,
.site-player-cover-leave-to {
  opacity: 0;
}

@media screen and (max-width: 900px) {
  .site-player__time {
    display: none;
  }

  /* On phones the row has no horizontal room for a readable waveform, so it
     moves to a full-width second line while the info and SoundCloud stay above. */
  .site-player.is-set .site-player__layer--set {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: 40px 16px;
    column-gap: 0.5rem;
    row-gap: 0;
    align-items: center;
  }

  .site-player__layer--set .site-player__meta {
    grid-column: 1;
    grid-row: 1;
    max-width: none;
  }

  .site-player__layer--set .site-player__side {
    grid-column: 2;
    grid-row: 1;
  }

  .site-player__waveform {
    grid-column: 1 / -1;
    grid-row: 2;
    width: 100%;
  }

  .site-player__close {
    width: 40px;
    height: 40px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .site-player__layer {
    transition: opacity 80ms ease;
  }

  .site-player-cover-enter-active,
  .site-player-cover-leave-active {
    transition: none;
  }
}
</style>

