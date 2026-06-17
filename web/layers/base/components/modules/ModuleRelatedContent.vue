<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useMainStore } from "~/stores/mainStore";

const { locale: _locale } = useI18n();
const { getSoundcloudArtwork, playTrack } = useSoundcloudArtwork();
const { navigateToTagSearch } = useTagNavigation();

const mainStore = useMainStore();

const props = defineProps({
	// Data array (e.g. data?.parentShow?.sets)
	items: {
		type: Array,
		default: () => [],
	},
	// Content type (sets, shows, persons, venues, words)
	type: {
		type: String,
		required: true,
		validator: (value) => {
			return [
				"sets",
				"shows",
				"words",
				"persons",
				"venues",
				"pool",
				"article",
				"primary",
				"secondary",
				"accent",
				"blue",
				"green",
				"yellow",
			].includes(value);
		},
	},
	// Optional title
	title: {
		type: String,
		default: "",
	},
	// Number of items to display INITIALLY per row
	limit: {
		type: Number,
		default: 3,
	},
	// Number of items per row (default: 3)
	itemsPerRow: {
		type: Number,
		default: 3,
	},
	// Display style
	style: {
		type: String,
		default: "default",
	},
	// Square everywhere except explicit portrait (e.g. pool Related)
	imageAspect: {
		type: String,
		default: "square",
		validator: (value: string) => ["square", "portrait"].includes(value),
	},
});

// State for visible items
const itemsPerPage = props.itemsPerRow || 3;
const visibleItemCount = ref(props.limit || itemsPerPage);

// Computeds and hooks
const typeClassMap = {
	sets: "sets",
	shows: "shows",
	words: "words",
	persons: "pool",
	venues: "pool",
	pool: "pool",
	article: "words",
	primary: "sets",
	secondary: "shows",
	accent: "pool",
	blue: "pool",
	green: "words",
	yellow: "sets",
};

// CSS class corresponding to the type
const typeClass = computed(() => {
	return typeClassMap[props.type] || "default";
});

// Filtered items based on visibleItemCount
const visibleItems = computed(() => {
	if (!props.items || !Array.isArray(props.items)) return [];
	return props.items.slice(0, visibleItemCount.value);
});

// Function to load more items
function loadMoreItems() {
	visibleItemCount.value += itemsPerPage;

	// Important: after loading new items we must load the artwork URLs for the new items
	nextTick(() => {
		if (props.type === "sets") {
			// Load all newly added items
			const newItems = props.items.slice(
				visibleItemCount.value - itemsPerPage,
				visibleItemCount.value,
			);
			newItems.forEach((item) => {
				if (!artworkUrls.value.has(item?._id)) {
					loadArtworkUrl(item);
				}
			});
		}
	});
}

// Determine whether more items are available to load
const hasMoreItems = computed(() => {
	return props.items && props.items.length > visibleItemCount.value;
});

// Artwork URLs for SoundCloud tracks
const artworkUrls = ref(new Map());

// Helper function for formatting date/time
function formatDate(dateString) {
	if (!dateString) return "";
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

// Functions for image handling
function getItemImage(item) {
	// If no item exists, immediately return a fallback image
	if (!item) return mainStore?.siteFallbacks?.fallbackSet?.image;

	// Fallbacks depending on content type
	const itemType = item?._type || "";
	let image = null;

	// Image from the item itself
	if (item?.image?.asset) {
		image = item?.image;
	} else if (item?.mainImage?.asset) {
		image = item?.mainImage;
	} else {
		// Fallback images depending on type
		switch (itemType) {
			case "person":
				image = mainStore?.siteFallbacks?.fallbackPerson?.image;
				break;
			case "venue":
				image = mainStore?.siteFallbacks?.fallbackVenue?.image;
				break;
			case "show":
				image = mainStore?.siteFallbacks?.fallbackShow?.image;
				break;
			case "set":
				// Try the parentShow image first
				if (item?.parentShow?.image?.asset?.url) {
					image = item?.parentShow?.image;
				} else {
					image = mainStore?.siteFallbacks?.fallbackSet?.image;
				}
				break;
			case "word":
			case "article":
				image = mainStore?.siteFallbacks?.fallbackArticle?.image;
				break;
			default:
				// General fallback image
				image = mainStore?.siteFallbacks?.fallbackSet?.image;
		}
	}

	return image;
}

// Load SoundCloud artwork (synchronous without checkImage)
function loadArtworkUrl(item) {
	if (!item) return;
	// Check whether the URL is already in the cache
	if (artworkUrls.value.has(item?._id)) return;
	const url = getSoundcloudArtwork(item);
	artworkUrls.value.set(item?._id, url);
}

function _checkImage(url) {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve(true);
		img.onerror = () => resolve(false);
		img.src = url;
	});
}

// Retrieve city tags (used in template)
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used in template
function _getItemCityTags(item) {
	const cityTags = [];

	// Direct city tags
	if (item?.tags && Array.isArray(item?.tags)) {
		item?.tags.forEach((tag) => {
			if (tag._type === "tag.city") {
				cityTags.push(tag);
			}
		});
	}

	// City tags from parentShow
	if (item?.parentShow?.tags && Array.isArray(item?.parentShow?.tags)) {
		item?.parentShow?.tags.forEach((tag) => {
			if (tag._type === "tag.city") {
				if (!cityTags.some((existingTag) => existingTag._id === tag._id)) {
					cityTags.push(tag);
				}
			}
		});
	}

	return cityTags;
}

// Retrieve non-city tags
function getItemNonCityTags(item) {
	if (!item?.tags || !Array.isArray(item?.tags)) return [];
	return item?.tags.filter((tag) => tag._type !== "tag.city");
}

// Watcher for visibleItems to load artwork URLs for new items
watch(
	visibleItems,
	(newItems) => {
		if (props.type === "sets") {
			newItems.forEach((item) => {
				if (!artworkUrls.value.has(item?._id)) {
					loadArtworkUrl(item);
				}
			});
		}
	},
	{ deep: true },
);

// Lifecycle Hooks
onMounted(() => {
	// On first load, load the artworks for visible items
	if (props.type === "sets") {
		visibleItems.value.forEach((item) => {
			loadArtworkUrl(item);
		});
	}
	// Note: Watcher handles additional items when loadMore is called
});
</script>

<template>
	<div
		v-if="items && items.length > 0"
		class="related-content"
		:class="[type, { 'related-content--portrait': imageAspect === 'portrait' }]"
	>
		<h2 v-if="title" class="related-content__title">{{ title }}</h2>

		<div class="related-content__grid">
			<!-- Grid items -->
			<div
				v-for="item in visibleItems"
				:key="item?._id"
				:class="`related-item related-item--${style} ${typeClass}`"
			>
				<!-- Image -->
				<ElementsContentLink :item="item" class="related-item__link">
					<div v-if="type === 'sets'" class="related-item__image">
						<img
							v-if="item?.image && item?.image.asset && item?.image.asset.url"
							:src="item?.image.asset.url"
							:alt="item?.title || ''"
							loading="lazy"
						>
						<div v-else-if="item?.soundcloud" class="track-artwork">
							<img
								v-if="artworkUrls.get(item?._id)"
								:src="artworkUrls.get(item?._id)"
								alt="Track Artwork"
								class="track-image"
							>
							<div v-else class="track-artwork-placeholder"/>
						</div>
						<!-- Additional fallback for sets without artwork -->
						<div v-else class="image-placeholder">
							<img
								v-if="mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url"
								:src="mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url"
								alt="Fallback Image"
								class="fallback-image"
							>
						</div>
					</div>
					<div v-else class="related-item__image">
						<img
							v-if="
								getItemImage(item) &&
									getItemImage(item).asset &&
									getItemImage(item).asset.url
							"
							:src="getItemImage(item).asset.url"
							:alt="item?.title || ''"
						>
						<div v-else class="image-placeholder">
							<img
								v-if="mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url"
								:src="mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url"
								alt="Fallback Image"
								class="fallback-image"
							>
						</div>
					</div>
				</ElementsContentLink>

				<!-- Content -->
				<div class="related-item__content">
					<!-- Interactive area with date and play button -->
					<section
						v-if="type !== 'pool' && type !== 'words'"
						class="related-item__content__interactive"
					>
						<!-- Date (if present) -->
						<div
							v-if="
								item?.datetime ||
									item?.publishedAt ||
									item?._updatedAt ||
									item?._createdAt
							"
							class="related-item__date"
						>
							{{
								formatDate(
									item?.datetime ||
										item?.publishedAt ||
										item?._updatedAt ||
										item?._createdAt
								)
							}}
						</div>

						<!-- Play button for sets -->
						<button
							v-if="type === 'sets' && item?.soundcloud"
							class="play-button"
							@click.prevent="playTrack(item)"
						>
							<span class="sr-only">Play</span>
							<svg
								width="9"
								height="12"
								viewBox="0 0 9 12"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d="M9 6L0 11.1962L0 0.803847L9 6Z" fill="currentColor" />
							</svg>
						</button>
					</section>

					<!-- Show information for sets -->
					<div
						v-if="item?.parentShow && type === 'sets'"
						class="related-item__content__show"
					>
						<!-- Show title (only display if NOT no-show) -->
						<ElementsContentLink
							v-if="item?.parentShow?.title?.toLowerCase() !== 'no-show'"
							:show="item?.parentShow"
							class="related-item__link"
						>
							<h3 class="related-item__title show-title">
								{{ item?.parentShow?.title }}
							</h3>
						</ElementsContentLink>
						<!-- If no-show: display only the set title -->
						<h3
							v-else-if="
								item?.parentShow?.title?.toLowerCase() === 'no-show' &&
									item?.title
							"
							class="related-item__title show-title"
						>
							{{ item?.title }}
						</h3>
						<!-- Fallback for other cases -->
						<h3 v-else-if="item?.title" class="related-item__title show-title">
							{{ item?.title }}
						</h3>

						<!-- Artists (for sets) -->
						<div
							v-if="item?.persons && item?.persons.length > 0"
							class="show-artists"
						>
							<h3
								v-for="(artist, index) in item?.persons"
								:key="artist._id"
								class="related-item__artist"
							>
								<ElementsContentLink
									v-if="artist?.poolVisibility"
									:pool="artist"
									class="related-item__link"
								>
									{{ artist?.title
									}}{{ index < item?.persons?.length - 1 ? "," : "" }}&nbsp;
								</ElementsContentLink>
								<span v-else>
									{{ artist.title
									}}{{ index < item?.persons?.length - 1 ? "," : "" }}&nbsp;
								</span>
							</h3>
						</div>
					</div>

					<!-- Words: Read More -->
					<div v-if="type === 'words'" class="tags read-more">
						<ElementsContentLink :item="item" class="related-item__link"
						><h3 class="tag">Read More</h3></ElementsContentLink
						>
					</div>

					<!-- Title for all other content types -->
					<ElementsContentLink
						v-if="type !== 'sets'"
						:item="item"
						class="related-item__link"
					>
						<h3 class="related-item__title">
							{{ item?.title || item?.name }}
						</h3>
					</ElementsContentLink>
					<RichText
						v-if="type === 'words'"
						:blocks="parseI18nObj(item?.textTeaser)"
					/>
					<RichText
						v-else-if="item?.useTeaserText && item?.textTeaser"
						:blocks="parseI18nObj(item?.textTeaser)"
					/>
					<RichText
						v-else-if="
							!item?.useTeaserText && item?.text && item?.text.length > 0
						"
						:blocks="parseI18nObj(item?.text)?.slice(0, 1)"
					/>
					<RichText
						v-else-if="
							!item?.text &&
								item?.description &&
								item?.description.length > 0 &&
								parseI18nObj(item?.description)
						"
						:blocks="
							limitTextBlocks(parseI18nObj(item?.description)?.slice(0, 1), 100)
						"
					/>

					<!-- Words: Non-City Tags -->
					<div
						v-if="type === 'words' && getItemNonCityTags(item).length > 0"
						class="related-item__tags tags"
					>
						<button
							v-for="tag in getItemNonCityTags(item)"
							:key="tag._id"
							class="tag clickable"
							@click.prevent="navigateToTagSearch(tag, item)"
						>
							{{ getI18nLabel(tag?.title) }}
						</button>
					</div>

					<!-- Display non-city tags -->
					<div
						v-else-if="getItemNonCityTags(item).length > 0"
						class="related-item__tags tags"
					>
						<button
							v-for="tag in getItemNonCityTags(item)"
							:key="tag._id"
							class="tag clickable"
							@click.prevent="navigateToTagSearch(tag, item)"
						>
							{{ getI18nLabel(tag.title) }}
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Load More Button -->
		<div v-if="hasMoreItems" class="related-content__load-more">
			<button class="load-more-button" @click="loadMoreItems">
				<svg
					width="15"
					height="15"
					viewBox="0 0 15 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path d="M7.67578 0.541016V14.8113" stroke-width="5" />
					<path d="M14.8105 7.67578L0.540276 7.67578" stroke-width="5" />
				</svg>
			</button>
		</div>
	</div>
</template>
<style lang="postcss" scoped>
.page--article-detail {
  .related-content {
    margin: var(--mid-margin) 0 0;
  }
}

.related-content {
  width: 100%;
  max-width: var(--page-max-width);
  margin: var(--mid-margin) 0;

  &__title {
    font-size: var(--heading-font-size);
    margin-bottom: var(--mid-margin);
  }

  &__grid {
    min-width: calc(var(--page-max-width) + var(--big-margin));
    margin: 0 0 0 calc(var(--big-margin) * -0.5);
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: stretch;
    padding: 0 calc(var(--big-margin) / 2);
    gap: calc(var(--big-margin) / 2) calc(var(--big-margin) * 1.9875);
  }

  &__load-more {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--mid-margin);

    .load-more-button {
      display: flex;
      align-items: center;
      gap: var(--small-padding);
      padding: var(--small-padding) var(--big-padding);
      background-color: transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: var(--font-text-semibold);
      background-color: var(--color-bg);
      border-radius: 100px;

      &:hover {
        @media (min-width: 1024px) {
          color: var(--color-bg);
        }
      }

      svg {
        width: var(--base-font-size);
        height: var(--base-font-size);
      }

      .plus-icon {
        font-size: 1.2rem;
      }
    }
  }

  .related-item__content__show {
    min-height: calc(
      var(--base-font-size) * 1.15 + var(--base-font-size) + var(--mid-padding)
    );
  }

  .related-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    flex: 1 1 calc(100% / 3 - var(--big-margin) * 1.325);
    max-width: calc(100% / 3 - var(--big-margin) * 1.325);
    width: 100%;
    /* border-bottom: 0.09325rem solid var(--color-text); */
    padding: 0 0 calc(var(--big-margin) / 2) 0;

    &:last-of-type {
      justify-self: flex-start;
      margin: 0 auto 0 0;
    }

    /* Ensure a line break occurs after every third item */
    &:nth-child(3n) {
      margin-right: 0;
    }

    &:nth-child(3n + 1):nth-last-child(-n + 3),
    &:nth-child(3n + 1):nth-last-child(-n + 3) ~ .related-item {
      margin-bottom: 0;
    }

    &__link {
      display: contents;
      text-decoration: none;
      color: inherit;
    }

    &__image {
      position: relative;
      overflow: hidden;
      width: 100%;

      img {
        width: 100%;
        height: auto;
        aspect-ratio: 1/1 !important;
        object-fit: cover;
        transition: transform 0.2s ease;
      }

      &:hover img {
        @media (min-width: 1024px) {
          transform: scale(1.05);
        }
      }

      .track-artwork-placeholder,
      .image-placeholder {
        width: 100%;
        aspect-ratio: 1/1;
        background-color: var(--color-grey);
      }
    }

    &__content {
      width: 100%;
      display: flex;
      flex-flow: column nowrap;
      justify-content: flex-start;
      align-items: stretch;
      flex: 1 1 auto;
      margin: var(--mid-padding) 0 0 0;
      gap: var(--mid-padding);

      &__interactive {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;

        .related-item__date {
          font-size: var(--small-font-size);
          text-transform: uppercase;
        }

        .play-button {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-left: auto;
          background-color: var(--color-text);
          border-radius: 100px;
          border: none;
          padding: 4px;
          width: calc(var(--base-font-size) + 4px);
          height: calc(var(--base-font-size) + 4px);

          svg {
            height: var(--base-font-size);
            transform: translate(1px, 0);
            path {
              fill: var(--color-bg);
            }
          }
        }
      }

      .related-item__title {
        font-size: var(--base-font-size);
        text-transform: uppercase;
        font-family: var(--font-text-semibold);
        margin: 0;
      }

      .related-item__artist {
        font-size: var(--base-font-size);
        text-transform: uppercase;
        font-family: var(--font-text-semibold);
        margin: 0;
      }

      .show-artists {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
        align-items: center;
        margin-bottom: var(--mid-padding);
      }

      .related-item__tags {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
        align-items: flex-start;
        align-content: flex-end;
        gap: var(--small-margin);
        margin-top: auto;
      }
    }

    &__tags {
      &.city-tags {
        left: var(--small-margin);
        z-index: 2;
      }
    }
  }

  /* Content-Type Styling */
  &.sets,
  &.shows {
    .tag {
      &.city {
        background-color: var(--color-pink);
        color: var(--color-white);
      }
    }
    .play-button {
      &:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-pink);
        }
      }
    }
  }

  &.words {
    .related-content__grid {
      gap: calc(var(--big-padding) * 3);
    }

    .tag {
      &.city {
        background-color: var(--color-green);
        color: var(--color-white);
      }
    }

    .related-item {
      position: relative;
      flex: 1 1 50%;
      max-width: calc(50% - var(--big-padding) * 1.5);
      background-color: var(--color-text);
      border-radius: 12px;
      border: 1px solid var(--color-text);
      overflow: hidden;
      padding: 0;
      margin-right: 0;

      .related-item__content__interactive,
      .city-tags {
        display: none;
      }

      &__link {
        color: var(--color-bg);
      }

      &__image {
        width: 100%;

        img {
          aspect-ratio: 3 / 1.5 !important;
          width: 100%;
        }
      }

      &__content {
        position: relative;
        gap: var(--big-padding);
        margin: 0;
        padding: var(--base-margin) var(--mid-padding);
        color: var(--color-bg);

        .read-more {
          position: absolute;
          transform: translate(0, calc(var(--base-margin) * -1 - 50%));
          .tag {
            border: 1px solid var(--color-text);
            background-color: var(--color-bg);
            color: var(--color-text);
          }
        }

        .related-item__title {
          color: var(--color-bg);
        }

        .related-item__tags {
          position: absolute;
          top: var(--base-padding);
          right: var(--base-padding);
          color: var(--color-bg);
          flex-grow: 0;
          margin-top: 0;

          .tag {
            background-color: transparent;
            color: var(--color-bg);
            padding: 2px 8px;
            border: 1px solid var(--color-bg);

            &:hover {
              background-color: var(--color-bg);
              color: var(--color-text);
            }
          }
        }

        .rich-text,
        .rich-text * {
          color: var(--color-bg);
        }
      }
    }
  }

  &.pool {
    .tag {
      &.city {
        background-color: var(--color-blue);
        color: var(--color-white);
      }
    }

    &.related-content--portrait {
      .related-content__grid {
        .related-item {
          &__image {
            img {
              aspect-ratio: 3/4 !important;
            }

            .track-artwork-placeholder,
            .image-placeholder {
              aspect-ratio: 3/4;
            }
          }
        }
      }
    }
  }
}

/* Responsive adjustments */
@media (max-width: 900px) {
  .related-content {
    &__grid {
      min-width: 0;
      width: 100%;
      margin: 0;
      padding: 0;
      gap: calc(var(--big-padding) * 2);
    }

    &.words .related-item {
      flex: 1 1 100%;
      max-width: 100%;
      width: 100%;

      &__content {
        gap: var(--card-content-gap);
        padding: var(--card-content-padding-y) var(--card-content-padding-x);

        .read-more {
          transform: translate(
            0,
            calc(var(--card-content-padding-y) * -1 - 50%)
          );
        }
      }
    }

    .related-item {
      max-width: 100%;
      width: 100%;

      /* Adjustments for 2-column grid */
      &:nth-child(3n) {
        margin-right: var(--small-margin);
      }

      &:nth-child(2n) {
        margin-right: 0;
      }

      &:nth-child(2n + 1):nth-last-child(-n + 2),
      &:nth-child(2n + 1):nth-last-child(-n + 2) ~ .related-item {
        margin-bottom: 0;
      }
    }
  }
}
</style>