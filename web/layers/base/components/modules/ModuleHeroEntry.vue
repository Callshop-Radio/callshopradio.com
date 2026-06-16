<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useMainStore } from "~/stores/mainStore";

// Composables
const localePath = useLocalePath();
const mainStore = useMainStore();
const { navigateToTagSearch } = useTagNavigation();

// Type Definitions
interface Image {
	asset?: {
		url?: string;
	};
}

interface SoundCloudTrack {
	id?: string;
	artwork_url?: string;
	permalink_url?: string;
}

interface ParentShow {
	title?: string;
	slug?: {
		current?: string;
	};
	image?: Image;
}

interface ContentReference {
	_id?: string;
	_type?: string;
	title?: string;
	image?: Image;
	mainImage?: Image;
	parentShow?: ParentShow;
	datetime?: string;
	_updatedAt?: string;
	useTeaserText?: boolean;
	textTeaser?: unknown[];
	text?: unknown[];
	description?: unknown[];
	bio?: unknown[];
	tags?: unknown[];
	persons?: Array<{
		_id?: string;
		title?: string;
		poolVisibility?: boolean;
		slug?: {
			current?: string;
		};
	}>;
	slug?: {
		current?: string;
	};
	soundcloud?: {
		tracks?: SoundCloudTrack[];
	};
}

interface Link {
	title?: string;
	[key: string]: unknown;
}

interface Module {
	title?: string;
	text?: unknown[];
	layout?: string;
	contentReference?: ContentReference;
	link?: Link;
	type?: string;
}

// Props
const props = defineProps<{
	module: Module;
}>();

// Image Management Composable
const useImageManagement = () => {
	function getItemImage(item?: ContentReference): Image | null {
		if (!item) return null;

		// Primäres Bild aus dem Item
		if (item.image || item.mainImage) {
			return (item.image || item.mainImage) ?? null;
		}

		// Fallback-Bilder basierend auf Content-Typ
		const fallbacks = mainStore.siteFallbacks;
		if (!fallbacks) return null;

		const fallbackMap: Record<string, Image | undefined> = {
			person: fallbacks.fallbackPerson?.image,
			venue: fallbacks.fallbackVenue?.image,
			show: fallbacks.fallbackShow?.image,
			set: fallbacks.fallbackSet?.image,
			word: fallbacks.fallbackArticle?.image,
			article: fallbacks.fallbackArticle?.image,
		};

		return (
			fallbackMap[item._type || ""] || fallbacks.fallbackPerson?.image || null
		);
	}

	function checkImageExists(url: string): Promise<boolean> {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => resolve(true);
			img.onerror = () => resolve(false);
			img.src = url;
		});
	}

	return {
		getItemImage,
		checkImageExists,
	};
};

// SoundCloud Composable
const useSoundCloud = () => {
	const artworkUrl = ref<string>("");
	const { checkImageExists: _checkImageExists } = useImageManagement();

	// Non-blocking artwork URL resolution
	function getSoundcloudArtwork(item?: ContentReference): string {
		if (!item) return "";

		const track = item.soundcloud?.tracks?.[0];
		const parentShowImageUrl = item.parentShow?.image?.asset?.url;
		const fallbackUrl = mainStore.siteFallbacks?.fallbackSet?.image?.asset?.url;

		// Try SoundCloud artwork (use -t500x500 for reliability)
		if (track?.artwork_url) {
			return track.artwork_url.replace("-large", "-t500x500");
		}

		// Fallback chain
		return parentShowImageUrl || fallbackUrl || "";
	}

	function loadArtworkUrl(): void {
		const contentRef = props.module?.contentReference;
		if (!contentRef) return;
		const url = getSoundcloudArtwork(contentRef);
		artworkUrl.value = url;
	}

	function playTrack(): void {
		const track = props.module?.contentReference?.soundcloud?.tracks?.[0];
		if (!track) return;

		// Stelle sicher, dass permalink_url gesetzt ist
		if (!track.permalink_url && track.id) {
			track.permalink_url = `https://api.soundcloud.com/tracks/${track.id}`;
		}

		mainStore.currentTrack = track;
	}

	return {
		artworkUrl,
		loadArtworkUrl,
		playTrack,
	};
};

// Initialize Composables
const { getItemImage } = useImageManagement();
const { artworkUrl, loadArtworkUrl, playTrack } = useSoundCloud();

// Computed Properties
const contentType = computed<string | null>(() => {
	return props.module?.contentReference?._type || null;
});

const layoutClass = computed<string>(() => {
	return `layout-${contentType.value || "default"}`;
});

const isAudioContent = computed<boolean>(() => {
	return contentType.value === "set";
});

const contentReference = computed(() => {
	return props.module?.contentReference;
});

const hasParentShow = computed(() => {
	const parentShow = contentReference.value?.parentShow;
	return parentShow && parentShow.title !== "No Show";
});

// Lifecycle
onMounted(() => {
	if (isAudioContent.value) {
		loadArtworkUrl();
	}
});
</script>

<template>
	<div v-if="module" :class="`module-hero-entry ${layoutClass}`">
		<div class="hero-entry-container">
			<!-- Bild/Media-Bereich -->
			<div class="hero-entry-media">
				<ElementsContentLink
					:item="contentReference"
					class="slide__link"
				>
					<MediaImage
						v-if="getItemImage(contentReference) && !isAudioContent"
						:image="getItemImage(contentReference) || undefined"
						class="hero-entry-image"
					/>
					<img
						v-else-if="isAudioContent && artworkUrl"
						:src="artworkUrl"
						alt="Audio Artwork"
						class="hero-entry-image track-artwork"
						loading="lazy"
					>
					<div
						v-else-if="isAudioContent"
						class="track-artwork-placeholder"
						@vue:mounted="loadArtworkUrl"
					/>
				</ElementsContentLink>
			</div>

			<!-- Content-Bereich -->
			<div class="hero-entry-content">
				<!-- Play-Button für Audio-Inhalte -->
				<button
					v-if="isAudioContent"
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

				<div class="hero-entry-content-container">
					<!-- Titel-Bereich -->
					<div class="hero-entry-header">
						<!-- Datum oder Update-Datum -->
						<div class="hero-entry-meta">
							<h3 v-if="contentReference?.datetime" class="hero-date">
								{{ formatDate(contentReference.datetime) }}
							</h3>
							<h3 v-else-if="contentReference?._updatedAt" class="hero-date">
								{{ formatDate(contentReference._updatedAt) }}
							</h3>
						</div>

						<!-- Set-spezifischer Titel-Bereich -->
						<div
							v-if="contentReference?._type === 'set'"
							class="hero-entry-title"
						>
							<ElementsContentLink
								v-if="hasParentShow"
								:show="contentReference.parentShow"
							>
								<h2 class="hero-entry-title">
									{{ contentReference.parentShow?.title }}
								</h2>
							</ElementsContentLink>

							<!-- Künstler (für Sets) -->
							<div
								v-if="contentReference.persons?.length"
								class="hero-entry-show-artists"
							>
								<h3
									v-for="(artist, index) in contentReference.persons"
									:key="artist?._id"
									class="hero-entry-show-artists-artist"
								>
									<ElementsContentLink
										v-if="artist?.poolVisibility"
										:pool="artist"
										class="hero-entry-show-artists-artist"
									>
										{{ artist.title
										}}{{
											index < contentReference.persons.length - 1 ? "," : ""
										}}&nbsp;
									</ElementsContentLink>
									<span v-else class="hero-entry-show-artists-artist">
										{{ artist?.title
										}}{{
											index < contentReference.persons.length - 1 ? "," : ""
										}}&nbsp;
									</span>
								</h3>
							</div>
						</div>

						<!-- Standard-Titel -->
						<h2 v-if="module.title" class="hero-entry-title">
							{{ module.title }}
						</h2>
						<h2
							v-else-if="
								contentReference?.title && contentReference._type !== 'set'
							"
							class="hero-entry-title"
						>
							{{ contentReference.title }}
						</h2>
					</div>

					<!-- Text-Bereich (nicht für Sets) -->
					<div v-if="contentReference?._type !== 'set'" class="hero-entry-text">
						<!-- Für Person und Venue -->
						<RichText
							v-if="contentReference?.description?.length"
							:blocks="
								limitTextBlocks(
									parseI18nObj(contentReference.description)?.slice(0, 1)
								)
							"
						/>
						<!-- Für andere Inhaltstypen, die möglicherweise ein bio-Feld haben -->
						<RichText
							v-else-if="contentReference?.bio?.length"
							:blocks="
								limitTextBlocks(parseI18nObj(contentReference.bio)?.slice(0, 1))
							"
						/>
						<RichText
							v-else-if="contentReference?.text?.length"
							:blocks="
								limitTextBlocks(
									parseI18nObj(contentReference.text)?.slice(0, 1)
								)
							"
						/>
						<RichText
							v-else-if="contentReference?.textTeaser?.length"
							:blocks="
								limitTextBlocks(
									parseI18nObj(contentReference.textTeaser)?.slice(0, 1)
								)
							"
						/>
					</div>

					<!-- Tags-Bereich -->
					<div
						v-if="contentReference?.tags?.length"
						class="hero-entry-tags tags"
					>
						<button
							v-for="(tag, tagIndex) in contentReference.tags.slice(0, 3)"
							:key="tag._id || `tag-${tagIndex}`"
							class="tag clickable"
							type="button"
							@click.prevent="navigateToTagSearch(tag, contentReference)"
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
.module-hero-entry {
  min-height: 5.3125rem;

  @media screen and (max-width: 900px) {
    min-height: 0;
  }

  @media screen and (min-width: 900px) {
    width: 100%;
    max-width: var(--page-max-width);
    min-height: 35.3125rem;
  }

  /* Einheitliches Layout für alle Content-Typen */
  .hero-entry-container {
    position: relative;
    width: 100%;
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    align-items: center;

    @media screen and (min-width: 901px) {
      height: 100%;
      min-height: 35.3125rem;
    }

    @media screen and (min-width: 1800px) {
      min-height: 43.3625rem;
    }

    .hero-entry-content-container {
      @media screen and (max-width: 900px) {
        max-width: calc(100% - 2rem - var(--base-padding) * 2);
      }
    }

    @media screen and (max-width: 900px) {
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-items: flex-start;
      position: relative;
      min-height: 0;
      height: auto;
      padding-bottom: 12.5%;
    }
  }

  .hero-entry-media {
    overflow: hidden;
    order: 2;
    border-radius: 1.5625rem;

    @media screen and (max-width: 900px) {
      transform: translate(0, 12.5%);
    }

    /* Einheitliches Bild-Format für alle Content-Typen */
    .hero-entry-image,
    .track-artwork,
    .track-artwork-placeholder {
      width: 100%;
      aspect-ratio: 1 / 1; /* Quadratisches Format für alle */
      object-fit: cover;
      background-color: var(--color-grey);
      min-width: 35.3125rem;
      max-width: 35.3125rem;
      max-height: 35.3125rem;

      @media screen and (max-width: 900px) {
        max-width: 100%;
        min-width: 100%;
        min-height: 100%;
        max-height: 100%;
      }
      @media screen and (min-width: 1800px) {
        min-height: 43.3625rem;
        min-width: 43.3625rem;
        max-width: 43.3625rem;
        max-height: 43.3625rem;
      }
    }
  }

  .hero-entry-content {
    position: absolute;
    left: 0;
    margin: 0;
    background-color: var(--color-bg);
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--mid-margin);
    order: 1;
    padding: var(--mid-padding);
    border-radius: 1.25rem;
    border: 0.0625rem solid var(--color-text);
    shape-rendering: crispEdges;
    width: clamp(300px, max-content, 397px);
    min-width: 390px;
    transform: translate(0, 50%);
    z-index: 10;

	 @media screen and (min-width: 1800px) {
		transform: translate(25%, 90%);
	 }

    @media screen and (max-width: 900px) {
      min-width: calc(100svw - var(--big-margin) * 4);
      width: 100%;
      transform: translate(calc(var(--big-margin) / 4), -25%);
    }
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
      @media screen and (max-width: 900px) {
        width: 2rem;
        height: 2rem;
      }
      svg {
        width: calc(4rem - var(--base-padding) * 2);
        height: calc(4rem - var(--base-padding) * 2);
        transform: translate(8%, 0);
        @media screen and (max-width: 900px) {
          width: calc(2.5rem - var(--base-padding) * 2);
          height: calc(2.5rem - var(--base-padding) * 2);
        }
        path {
          fill: var(--color-black);
        }
      }
    }
    &-container {
      display: flex;
      flex-flow: column wrap;
      justify-content: center;
      gap: var(--mid-padding);
    }
    .hero-entry-header {
      display: flex;
      flex-flow: column wrap;
      justify-content: center;
      gap: var(--mid-padding);

      .hero-entry-show-artists {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
      }

      .hero-entry-title,
      .hero-entry-show-artists-artist {
        font-size: var(--base-font-size);
        font-family: var(--font-text-semibold);
        font-weight: 500;
        text-transform: uppercase;
        width: max-content;
      }

      .hero-entry-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .hero-date {
          font-size: var(--small-font-size);
          text-transform: uppercase;
        }

        .play-button {
          display: flex;
          align-items: center;
          gap: var(--small-padding);
          background-color: var(--color-text);
          color: var(--color-bg);
          border: none;
          padding: var(--small-padding) var(--mid-padding);
          border-radius: 100px;
          font-size: var(--small-font-size);
          transition: background-color 0.2s ease;
          cursor: pointer;

          &:hover {
            @media (min-width: 1024px) {
              background-color: var(--color-grey);
            }
          }

          svg {
            width: 9px;
            height: 12px;
            path {
              fill: var(--color-black);
            }
          }
        }
      }
    }

    .hero-entry-text {
      font-size: var(--base-font-size);

      :deep(p) {
        margin-bottom: var(--mid-padding);
      }
    }

    .hero-entry-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--small-padding);
    }

    .hero-entry-actions {
      margin-top: var(--mid-margin);

      .hero-entry-link {
        display: inline-block;
        padding: var(--mid-padding) var(--big-padding);
        background-color: var(--color-text);
        color: var(--color-bg);
        text-decoration: none;
        font-weight: 500;
        transition: background-color 0.2s ease;

        &:hover {
          @media (min-width: 1024px) {
            background-color: var(--color-grey);
          }
        }
      }
    }
  }
}
</style>