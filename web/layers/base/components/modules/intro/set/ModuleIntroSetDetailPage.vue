<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useMainStore } from "~/stores/mainStore";
import type { SET_QUERY_RESULT } from "~~/types/sanity.types.gen";

type SetDetail = NonNullable<SET_QUERY_RESULT>;

const { locale: _locale, setLocale: _setLocale } = useI18n();
// Template references; height sync keeps the media column level with content.
const setContentRef = ref<HTMLElement | null>(null);
const { mainRef: setMainRef, computedHeight: computedSetMainHeight } =
	useDetailHeightSync();

// computedSetMainHeight is a px number on desktop but the string "100%" below
// 900px — branch like the pool page so the unit is only appended to numbers
// (otherwise mobile renders the invalid "100%px").
const setDetailsStyle = computed(() => {
	const h = computedSetMainHeight.value;
	if (typeof h === "string") return `max-height: ${h}; height: ${h}`;
	return `max-height: ${h}px; height: ${h}px`;
});

// Props
const props = defineProps<{
	set: SetDetail;
}>();

// Store
const mainStore = useMainStore();

// Description fallback. The two-column card collapses when the right column is
// empty, so a set with neither show nor episode copy must still render
// something. Prefer the CMS-managed fallback
// (fallbackGlobal.fallbackSet.description), else a hardcoded default.
const FALLBACK_SET_DESCRIPTION = "Press play and tune in.";
const fallbackDescriptionBlocks = computed(() => {
	const blocks = mainStore?.siteFallbacks?.fallbackSet?.description;
	return Array.isArray(blocks) && blocks.length > 0 ? blocks : null;
});

// SoundCloud artwork + playback via the shared useSoundcloudArtwork composable.
const { getSoundcloudArtwork, playTrack } = useSoundcloudArtwork();
const artworkUrl = ref("");

function loadArtworkUrl() {
	if (props.set) artworkUrl.value = getSoundcloudArtwork(props.set);
}

// Get non-city tags
function getItemNonCityTags(item: SetDetail) {
	if (!item?.tags || !Array.isArray(item?.tags)) return [];
	return item.tags.filter((tag) => tag._type !== "tag.city");
}

// Lifecycle hooks
onMounted(() => {
	loadArtworkUrl();
});
</script>

<template>
	<div
		v-if="set"
		ref="setContentRef"
		class="set-content">
		<div ref="setMainRef" class="set-main">
			<!-- Image/media area -->
			<div class="set-media">
				<ElementsContentLink :item="set" class="grid-item__link">
					<img
						v-if="artworkUrl"
						:src="artworkUrl"
						alt="Audio Artwork"
						class="set-image track-artwork"
						loading="lazy"
					>
					<div
						v-else
						class="track-artwork-placeholder"
						@vue:mounted="loadArtworkUrl"
					/>
				</ElementsContentLink>
			</div>

			<!-- Content area -->
			<div class="set-info">
				<!-- Play button for audio content -->
				<button
					class="play-button"
					aria-label="Play Audio"
					type="button"
					@click="playTrack(set)"
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
					<!-- Title area -->
					<div class="set-header">
						<!-- Date -->
						<div class="set-meta">
							<h3 v-if="set?.datetime" class="set-date">
								{{ formatDate(set.datetime) }}
							</h3>
							<h3 v-else-if="set?._updatedAt" class="set-date">
								{{ formatDate(set._updatedAt) }}
							</h3>
							<h3 v-else-if="set?.title" class="set-date">
								{{ set.title }}
							</h3>
						</div>
						<div class="set-show-title">
							<ElementsContentLink
								v-if="set?.parentShow?.title !== 'No Show' && set?.parentShow"
								:show="set?.parentShow"
								class="set__link set-title"
							>
								<h2 v-if="set?.parentShow?.title" class="set-title">
									{{ set?.parentShow?.title }}
								</h2>
							</ElementsContentLink>
							<div>
								<h3
									v-for="(artist, index) in set.persons ?? []"
									:key="artist._id"
									class="set__artist"
								>
									<ElementsContentLink
										v-if="artist?.poolVisibility"
										:pool="artist"
										class="set__artist"
									>
										{{ artist.title
										}}{{ index < (set.persons?.length ?? 0) - 1 ? "," : "" }}&nbsp;
									</ElementsContentLink>
									<span v-else class="set__artist">
										{{ artist.title
										}}{{ index < (set.persons?.length ?? 0) - 1 ? "," : "" }}&nbsp;
									</span>
								</h3>
							</div>
						</div>
					</div>
					<div v-if="getItemNonCityTags(set).length > 0" class="set-tags tags">
						<button
							v-for="(tag, index) in getItemNonCityTags(set)"
							:key="tag._id || index"
							class="tag"
							type="button"
						>
							{{
								getI18nLabel(tag?.title)
							}}
						</button>
					</div>
				</div>
			</div>
		</div>
		<div
			class="set-details"
			:style="setDetailsStyle"
		>
			<section v-if="set?.parentShow?.content">
				<h2>{{ set?.parentShow?.title }}</h2>
				<RichText :blocks="set?.parentShow?.content" />
			</section>
			<section v-if="set?.content">
				<h3>About this Episode</h3>
				<RichText :blocks="set?.content" />
			</section>
			<section v-else>
				<RichText
					v-if="fallbackDescriptionBlocks"
					:blocks="fallbackDescriptionBlocks"
				/>
				<p v-else>{{ FALLBACK_SET_DESCRIPTION }}</p>
			</section>
			<section v-if="set?.tracklistRich" class="tracklist">
				<h3>Tracklist</h3>
				<RichText class="tracklist-rich" :blocks="set?.tracklistRich" />
			</section>
			<section v-else-if="set?.tracklist" class="tracklist">
				<h3>Tracklist</h3>
				<div class="rich-text">
					<p v-for="(track, index) in set?.tracklist" :key="index">
						{{ track }}
					</p>
				</div>
			</section>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.set-content {
  /* margin: 0 auto; */
  width: var(--page-max-width);
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: flex-start;
  position: relative;
  border: 0.0625rem solid var(--color-text);
  border-radius: 1.5625rem;
  @media screen and (max-width: 900px) {
    flex-flow: column wrap;
  }

  .set-main {
    max-width: calc(var(--page-max-width) / 2.5);
    display: flex;
    flex-flow: column wrap;
    justify-content: center;
    align-items: center;
    position: relative;
    width: 100%;
    height: 100%;
    border-right: 0.0625rem solid var(--color-text);
    /* border: 0.0625rem solid var(--color-text);
    border-top-left-radius: 1.5625rem;
    border-bottom-left-radius: 1.5625rem; */
    overflow: scroll;
    @media screen and (max-width: 900px) {
      max-width: 100%;
      border-right: none;
    }

    .set-media {
      order: 2;
      border-bottom-left-radius: 1.5625rem;
      width: 100%;
      height: 100%;
      max-width: 100%;
      object-fit: cover;
      overflow: hidden;
      @media screen and (max-width: 900px) {
        max-width: 100%;
        max-height: 100%;
        border-bottom-left-radius: 0;
        border-bottom: 1px solid var(--color-text);
      }
      @media screen and (min-width: 900px) {
        min-width: calc(var(--page-max-width) / 2.5);
      }
      .track-artwork,
      .track-artwork-placeholder {
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        background-color: var(--color-grey);
        max-width: 100%;
        max-height: 100%;
        @media screen and (max-width: 900px) {
          max-width: 100%;
          max-height: 100%;
        }
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
    border-top-left-radius: 1.5625rem;
    border-top-right-radius: 1.5625rem;

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

  .set-details {
    position: relative;
    display: flex;
    flex-flow: column;
    justify-content: flex-start;
    align-items: flex-start;
    position: relative;
    overflow: scroll;
    height: 100%;
    width: calc(100% - calc(var(--page-max-width) / 2.5));
    padding: var(--base-margin) var(--big-margin) var(--big-margin);
    gap: var(--base-margin) 0;
    /* border-right: 1px solid var(--color-text);
    border-top: 1px solid var(--color-text);
    border-bottom: 1px solid var(--color-text);
    border-top-right-radius: 1.5625rem;
    border-bottom-right-radius: 1.5625rem; */
    @media screen and (max-width: 900px) {
      max-width: 100%;
      max-height: 100% !important;
      width: 100%;
      padding: var(--base-margin) var(--base-margin) var(--big-margin);
    }
    section {
      width: 100%;
      h3,
      h2,
      h4 {
        margin: 0 0 var(--base-padding) 0;
        text-transform: uppercase;
        font-family: var(--font-text-semibold);
        font-size: var(--base-font-size);
        font-weight: 500;
      }
      &.tracklist {
        .rich-text {
          width: 100%;
          p {
            line-height: 1.5;
          }
          :deep(p) {
            line-height: 1.5;
          }
        }
      }
    }
  }
}
</style>