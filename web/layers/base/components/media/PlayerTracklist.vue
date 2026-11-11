<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import type { PlayerTrack } from "~~/types/player";

const props = defineProps<{ tracks: PlayerTrack[] }>();
const emit = defineEmits<{ close: [] }>();
const root = ref<HTMLElement | null>(null);

function onPointerDown(event: PointerEvent) {
	if (root.value && !root.value.contains(event.target as Node)) emit("close");
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === "Escape") emit("close");
}

onMounted(() => {
	document.addEventListener("pointerdown", onPointerDown);
	document.addEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
	document.removeEventListener("pointerdown", onPointerDown);
	document.removeEventListener("keydown", onKeydown);
});
</script>

<template>
	<div
		ref="root"
		class="player-tracklist"
		role="dialog"
		aria-label="Live-Tracklist"
		@click.stop
	>
		<header class="player-tracklist__head">
			<span>Live-Tracklist</span>
			<button type="button" aria-label="Tracklist schließen" @click="emit('close')">×</button>
		</header>
		<ol v-if="props.tracks.length" class="player-tracklist__list">
			<li v-for="(track, index) in props.tracks" :key="`${track.title}-${index}`">
				<span class="player-tracklist__title">{{ track.title }}</span>
				<span v-if="track.artist" class="player-tracklist__artist">{{ track.artist }}</span>
			</li>
		</ol>
		<p v-else class="player-tracklist__empty">Noch keine Tracks.</p>
	</div>
</template>

<style lang="postcss" scoped>
.player-tracklist {
  position: absolute;
  top: calc(100% + 0.25rem);
  right: var(--page-gutter);
  z-index: 5;
  width: min(24rem, calc(100vw - 2rem));
  max-height: 40vh;
  overflow: auto;
  border: 1px solid color-mix(in srgb, var(--color-text) 14%, transparent);
  border-radius: 10px;
  background: var(--color-bg);
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.2);

  @media screen and (max-width: 900px) {
    right: var(--base-padding);
  }
}

.player-tracklist__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--color-text) 10%, transparent);
  font-family: var(--font-text-semibold);
  font-size: var(--small-font-size);

  button {
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: inherit;
    cursor: pointer;

    &:hover {
      background: var(--color-grey);
    }
  }
}

.player-tracklist__list {
  margin: 0;
  padding: 0.25rem 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.375rem 0.75rem;
    font-size: var(--small-font-size);
  }

  li + li {
    border-top: 1px solid color-mix(in srgb, var(--color-text) 6%, transparent);
  }
}

.player-tracklist__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-tracklist__artist {
  flex: none;
  color: var(--color-dark-grey);
}

.player-tracklist__empty {
  margin: 0;
  padding: 0.75rem;
  color: var(--color-dark-grey);
  font-size: var(--small-font-size);
}
</style>
