<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useMainStore } from "~/stores/mainStore";

const { locale: _locale, setLocale: _setLocale } = useI18n();
const localePath = useLocalePath();
const { getItemRoute } = useContentRoute();

// Typdefinitionen
interface Image {
	asset?: {
		url?: string;
	};
}

interface Person {
	_key?: string;
	title?: string;
}

interface Set {
	_id?: string;
	_type?: string;
	title?: string;
	image?: Image;
	mainImage?: Image;
	parentShow?: {
		title?: string;
		image?: Image;
	};
	datetime?: string;
	_updatedAt?: string;
	persons?: Person[];
	tags?: import("~/types/sanity").Tag[];
	soundcloud?: {
		tracks?: Array<{
			id?: string;
			artwork_url?: string;
			permalink_url?: string;
		}>;
	};
}

// Props
const props = withDefaults(
	defineProps<{
		set: Set;
		layout?: "default" | "cover-flow";
		mediaActive?: boolean;
	}>(),
	{
		layout: "default",
		mediaActive: true,
	},
);

// Store
const mainStore = useMainStore();

// Composable für Bild-Management
const useImageManagement = () => {
	// Helper-Funktion für Bild-Fetching und Fallbacks
	function _getItemImage(item?: Set): Image | null {
		if (!item) return null;

		// Bild aus dem Item selbst
		if (item.image || item.mainImage) {
			return item.image || item.mainImage;
		}

		// Fallback für Sets
		return mainStore?.siteFallbacks?.fallbackSet?.image;
	}

	function checkImage(url: string): Promise<boolean> {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => resolve(true);
			img.onerror = () => resolve(false);
			img.src = url;
		});
	}

	return {
		getItemImage: _getItemImage,
		checkImage,
	};
};

// Composable für SoundCloud-Funktionalität
const useSoundCloud = () => {
	const artworkUrl = ref("");
	const { checkImage: _checkImage } = useImageManagement();

	// Non-blocking artwork URL resolution
	function getSoundcloudArtwork(item?: Set): string {
		if (!item) return "";

		// Try SoundCloud artwork first
		const artworkUrl = item?.soundcloud?.tracks?.[0]?.artwork_url;
		if (artworkUrl) {
			return artworkUrl.replace("-large", "-t500x500");
		}

		// Fallback chain
		const parentShowImageUrl = item?.parentShow?.image?.asset?.url;
		const storeFallbackUrl =
			mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url;
		return parentShowImageUrl || storeFallbackUrl || "";
	}

	function loadArtworkUrl() {
		if (!props.set) return;
		const url = getSoundcloudArtwork(props.set);
		artworkUrl.value = url;
	}

	function playTrack() {
		const item = props.set;
		if (!item?.soundcloud?.tracks?.[0]) return;

		const track = item.soundcloud.tracks[0];

		// Sicherstellen, dass permalink_url gesetzt ist
		if (!track.permalink_url && track.id) {
			track.permalink_url = `https://api.soundcloud.com/tracks/${track.id}`;
		}

		// Track im Store speichern
		mainStore.currentTrack = track;
	}

	return {
		artworkUrl,
		loadArtworkUrl,
		playTrack,
	};
};

// Anwendung der Composables
const { getItemImage: _getItemImage } = useImageManagement();
const { artworkUrl, loadArtworkUrl, playTrack } = useSoundCloud();

// Lebenszyklus-Hooks
watch(
	() => [props.mediaActive, props.set?._id] as const,
	([active]) => {
		if (active) loadArtworkUrl();
	},
	{ immediate: true },
);

onMounted(() => {
	if (props.mediaActive) loadArtworkUrl();
});
</script>

<template>
	<div
		v-if="set"
		class="set-content"
		:class="`set-content--${props.layout}`"
	>
		<div class="set-main">
			<!-- Bild/Media-Bereich -->
			<div class="set-media">
				<NuxtLink
					v-if="set"
					:to="getItemRoute(set)"
					class="grid-item__link">
					<img
						v-if="mediaActive && artworkUrl"
						:src="artworkUrl"
						alt="Audio Artwork"
						class="set-image track-artwork"
						loading="lazy"
					>
					<div
						v-else-if="mediaActive"
						class="track-artwork-placeholder"
						@vue:mounted="loadArtworkUrl"
					/>
					<div v-else class="track-artwork-placeholder" />
				</NuxtLink>
			</div>

			<!-- Content-Bereich -->
			<div class="set-info">
				<!-- Play-Button für Audio-Inhalte -->
				<button
					class="play-button"
					aria-label="Play Audio"
					type="button"
					@click="playTrack"
				>
					<svg
						width="16"
						height="18"
						viewBox="0 0 9 12"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
						aria-hidden="true"
					>
						<path
							d="M9 6L-4.89399e-07 11.1962L-3.51373e-08 0.803847L9 6Z"
							fill="currentColor"
						/>
					</svg>
				</button>

				<div class="set-info-container">
					<!-- Titel-Bereich -->
					<div class="set-header">
						<!-- Datum -->
						<div class="set-meta">
							<h3 v-if="set?.datetime" class="set-date">
								{{ formatDate(set.datetime) }}
							</h3>
							<h3 v-else-if="set?._updatedAt" class="set-date">
								{{ formatDate(set._updatedAt) }}
							</h3>
						</div>
						<div class="set-show-title">
							<NuxtLink
								v-if="set?.parentShow?.title !== 'No Show' && set?.parentShow"
								:to="localePath(`/shows/${set?.parentShow?.slug?.current}`)"
								class="set__link set-title"
							>
								<h2 v-if="set?.parentShow?.title" class="set-title">
									{{ set?.parentShow?.title }}
								</h2>
							</NuxtLink>
							<div class="set__artist-container">
								<h3
									v-for="(artist, index) in set.persons"
									:key="artist._key"
									class="set__artist"
								>
									<NuxtLink
										v-if="artist?.poolVisibility"
										:to="localePath(`/pool/${artist?.slug.current}`)"
										class="set__artist"
									>
										{{ artist.title
										}}{{ index < set.persons.length - 1 ? "," : "" }}&nbsp;
									</NuxtLink>
									<span v-else class="set__artist">
										{{ artist.title
										}}{{ index < set.persons.length - 1 ? "," : "" }}&nbsp;
									</span>
								</h3>
							</div>
						</div>
					</div>
					<div v-if="set?.tags?.length" class="set-tags tags">
						<button
							v-for="tag in set?.tags.slice(0,3)"
							:key="tag._id || index"
							class="tag"
							type="button"
						>
							{{ getI18nLabel(tag?.title) }}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.set-content {
  width: 100%;
  max-width: 35.3125rem;
  height: max-content;

  .set-main {
    width: max-content;
    display: flex;
    flex-flow: column wrap;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 100%;
    height: 100%;
    border: 0.0625rem solid var(--color-text);
    border-radius: 1.5625rem;
    overflow: hidden;
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }

    .set-media {
      order: 2;
      border-radius: 1.5625rem;
      width: 100%;
      height: 100%;
      max-width: 35.3125rem;
      max-height: 35.3125rem;
      .track-artwork,
      .track-artwork-placeholder {
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        background-color: var(--color-grey);
        max-width: 35.3125rem;
        max-height: 35.3125rem;
      }
    }
  }

  .set-info {
    left: 0;
    margin: 0;
    width: 100%;
    background-color: var(--color-bg);
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    align-items: center;
    flex-grow: 1;
    gap: var(--mid-margin);
    order: 1;
    padding: var(--mid-padding);
    border-bottom: 0.0625rem solid var(--color-text);
    shape-rendering: crispEdges;
    z-index: 10;

    .play-button {
      display: flex;
      flex-flow: column wrap;
      justify-content: center;
      align-items: center;
      border-radius: 100px;
      aspect-ratio: 1/1;
      width: max-content;
      width: 4rem;
      height: 4rem;
      svg {
        width: calc(4rem - var(--base-padding) * 2);
        height: calc(4rem - var(--base-padding) * 2);
        transform: translate(8%, 0);
        path {
          fill: var(--color-black);
        }
      }
    }

    .set-tags {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      gap: var(--base-padding);
    }

    &-container {
      display: flex;
      flex-flow: column wrap;
      justify-content: center;
      gap: var(--mid-padding);
      width: calc(100% - 4rem - var(--mid-margin));
    }

    .set-header {
      display: flex;
      flex-flow: column wrap;
      justify-content: center;
      gap: var(--mid-padding);

      .set-show-title {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
        a {
          width: max-content;
        }
        div {
          width: 100%;
          display: flex;
          flex-flow: row wrap;
          justify-content: flex-start;
        }
      }
      .set__artist-container { 
        min-height: calc(var(--base-font-size) * 2);
      }

      .set-title,
      .set-artist,
      .set__artist {
        font-size: var(--base-font-size);
        font-family: var(--font-text-semibold);
        font-weight: 500;
        text-transform: uppercase;
        a,
        &a {
          cursor: pointer;
        }
      }

      .set-title {
        width: 100%;
      }

      .set-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .set-date {
          font-size: var(--small-font-size);
          text-transform: uppercase;
        }
      }
    }
  }
}

.set-content--cover-flow {
  width: 100%;
  max-width: 100%;

  .set-main {
    width: 100%;
    overflow: hidden;
    border-radius: 1.5625rem;
  }

  .set-info {
    order: 1;
    flex: 0 0 auto;
    width: 100%;
    border-bottom: none;
    border-radius: 1.5625rem 1.5625rem 0 0;
    position: relative;
    z-index: 2;
    margin-bottom: -1.25rem;
    padding-bottom: calc(var(--mid-padding) + 1.25rem);

    &-container {
      width: calc(100% - 4rem - var(--mid-margin));
    }
  }

  .set-media {
    order: 2;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 1 / 1;
    height: auto;
    flex-shrink: 0;
    border-radius: 0 0 1.5625rem 1.5625rem;
    overflow: hidden;

    .track-artwork,
    .track-artwork-placeholder {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: none;
      aspect-ratio: 1 / 1;
    }
  }

  .set-tags {
    flex-wrap: wrap;
  }
}

@media screen and (max-width: 900px) {
  .set-content--cover-flow .set-info {
    padding-bottom: calc(var(--card-content-padding-y) + 1.25rem);

    .play-button {
      width: 2rem;
      height: 2rem;

      svg {
        width: calc(2rem - var(--base-padding));
        height: calc(2rem - var(--base-padding));
      }
    }

    &-container {
      width: calc(100% - 2rem - var(--mid-margin));
    }
  }

  .set-content .set-info {
    padding: var(--card-content-padding-y) var(--card-content-padding-x);

    .set-info-container,
    .set-header {
      gap: var(--card-content-gap);
    }
  }
}
</style>