<script setup lang="ts">
import { computed, ref, watch } from "vue";

// biome-ignore lint/suspicious/noExplicitAny: design lab prototypes read loose Sanity docs
type LabItem = Record<string, any>;

const props = defineProps<{
	item: LabItem;
	page: "shows" | "pool" | "words";
	active?: boolean;
	/** Inline aspect override so each layout can crop the same source freely. */
	aspect?: string;
}>();

const { getSoundcloudArtwork } = useSoundcloudArtwork();
const { getItemImage } = useContentImage();

const artwork = computed(() =>
	props.page === "shows" ? getSoundcloudArtwork(props.item) : "",
);

const hiResArtwork = computed(() => {
	const url = artwork.value;
	if (!url) return "";
	// SoundCloud serves -t500x500 for many sets where -original 404s. Keep the
	// same URL the set cards use; only upgrade Sanity fallbacks.
	if (url.includes("cdn.sanity.io")) {
		return url.replace(/([?&])w=\d+/, "$1w=1600");
	}
	return url;
});

const useHiRes = ref(true);
const artworkFailed = ref(false);
watch(
	() => props.item?._id,
	() => {
		useHiRes.value = true;
		artworkFailed.value = false;
	},
);

const artworkSrc = computed(() =>
	useHiRes.value ? hiResArtwork.value : artwork.value,
);

const image = computed(() =>
	props.page === "shows" ? undefined : getItemImage(props.item),
);

const label = computed(
	() => props.item?.title || props.item?.name || "Untitled",
);

const sizes = computed(() => {
	if (props.page === "pool") return "(max-width: 900px) 68vw, 25vw";
	if (props.page === "words") return "(max-width: 900px) 86vw, 66vw";
	return "100vw";
});

function onArtworkError() {
	// Try the Sanity fallback first; if the SoundCloud URL itself is dead,
	// replace the broken image with the styled placeholder.
	if (useHiRes.value && hiResArtwork.value !== artwork.value) {
		useHiRes.value = false;
		return;
	}
	artworkFailed.value = true;
}
</script>

<template>
	<div
		class="lab-media"
		:class="`lab-media--${page}`"
		:style="aspect ? { aspectRatio: aspect } : undefined"
	>
		<img
			v-if="page === 'shows' && artwork && !artworkFailed"
			:src="artworkSrc"
			:alt="label"
			class="lab-media__image"
			loading="eager"
			:fetchpriority="active ? 'high' : undefined"
			decoding="async"
			draggable="false"
			@error="onArtworkError"
		>
		<MediaImage
			v-else-if="page !== 'shows' && image"
			:image="image"
			:alt="label"
			:eager="true"
			:sizes="sizes"
			class="lab-media__sanity"
		/>
		<div v-else class="lab-media__placeholder">
			<span>{{ label }}</span>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.lab-media {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--lab-media-radius, 5px);
  background-color: var(--color-grey);
  isolation: isolate;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--color-text) 10%, transparent);
    pointer-events: none;
  }

  &__image,
  :deep(img) {
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    display: block;
    object-fit: cover;
    object-position: center;
    transition: transform var(--lab-motion, 720ms)
      cubic-bezier(0.22, 1, 0.36, 1);
  }

  &__placeholder {
    width: 100%;
    height: 100%;
    min-height: 16rem;
    display: grid;
    place-items: center;
    padding: var(--mid-padding);
    text-align: center;
    font-size: var(--small-font-size);
    text-transform: uppercase;
    letter-spacing: var(--button-letter-spacing);
    color: var(--color-bg);
    background:
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--lab-accent) 70%, var(--color-bg)) 0%,
        color-mix(in srgb, var(--lab-accent) 28%, var(--color-bg)) 100%
      );
  }

  &--shows {
    aspect-ratio: 1 / 1;
  }

  &--pool {
    aspect-ratio: 3 / 4;
  }

  &--words {
    aspect-ratio: 3 / 2;
  }
}

.lab-item[data-active="true"] .lab-media:hover :deep(img),
.lab-item[data-active="true"] .lab-media:hover .lab-media__image {
  transform: scale(1.025);
}

@media screen and (max-width: 900px) {
  .lab-media {
    border-radius: var(--lab-media-radius-mobile, 5px);
  }
}
</style>
