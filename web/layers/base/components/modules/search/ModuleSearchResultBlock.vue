<script setup lang="ts">
/**
 * ModuleSearchResultBlock - A reusable component for displaying search results by category
 * Based on ModuleContentTeaser but optimized for search results
 *
 * Props:
 * - items: Array of search result items (already sorted from parent)
 * - type: 'pool' | 'shows' | 'words' - determines styling and behavior
 * - title: Optional section title
 */

import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useMainStore } from "~/stores/mainStore";
import type { ContentItem, Image, Tag } from "~/types/sanity";

const { locale: _locale } = useI18n();
const localePath = useLocalePath();
const mainStore = useMainStore();

const { getItemRoute } = useContentRoute();
const { getSoundcloudArtwork, playTrack } = useSoundcloudArtwork();

const props = defineProps({
	items: {
		type: Array as () => ContentItem[],
		default: () => [],
	},
	type: {
		type: String as () => "pool" | "shows" | "words",
		required: true,
	},
	title: {
		type: String,
		default: "",
	},
});

// State
const ITEMS_PER_PAGE = 6;
const visibleItemCount = ref(ITEMS_PER_PAGE);
const artworkUrls = ref(new Map<string, string>());

// Color and styling based on type
const typeConfig = computed(() => {
	const configs: Record<
		string,
		{ color: string; label: string; cssClass: string }
	> = {
		pool: { color: "blue", label: "Pool", cssClass: "pool" },
		shows: { color: "pink", label: "Shows", cssClass: "sets" },
		words: { color: "green", label: "Words", cssClass: "words" },
	};
	return configs[props.type] || configs.shows;
});

// Visible items (paginated) - items come pre-sorted from parent
const visibleItems = computed(() => {
	return props.items.slice(0, visibleItemCount.value);
});

// Has more items to load
const hasMoreItems = computed(() => {
	return props.items.length > visibleItemCount.value;
});

// Functions
function loadMoreItems() {
	visibleItemCount.value += ITEMS_PER_PAGE;

	// Load artwork URLs for newly visible items (for shows/sets)
	if (props.type === "shows") {
		nextTick(() => {
			const newItems = props.items.slice(
				visibleItemCount.value - ITEMS_PER_PAGE,
				visibleItemCount.value,
			);
			newItems.forEach((item: ContentItem) => {
				if (!artworkUrls.value.has(item?._id)) {
					loadArtworkUrl(item);
				}
			});
		});
	}
}

function formatDate(dateString: string) {
	if (!dateString) return "";
	const date = new Date(dateString);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("de-DE", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function getItemImage(item: ContentItem): Image | undefined {
	if (item.image) return item.image;
	if (item.mainImage) return item.mainImage;

	const fallbacks: Record<string, Image | undefined> = {
		person: mainStore.siteFallbacks?.fallbackPerson?.image,
		venue: mainStore.siteFallbacks?.fallbackVenue?.image,
		show: mainStore.siteFallbacks?.fallbackShow?.image,
		set: mainStore.siteFallbacks?.fallbackSet?.image,
		article: mainStore.siteFallbacks?.fallbackArticle?.image,
	};

	return (
		fallbacks[item._type ?? ""] ?? mainStore.siteFallbacks?.fallbackSet?.image
	);
}

function getItemCityTags(item: ContentItem) {
	const cityTags: Tag[] = [];

	if (item?.tags && Array.isArray(item?.tags)) {
		item.tags.forEach((tag: Tag) => {
			if (tag._type === "tag.city") {
				cityTags.push(tag);
			}
		});
	}

	if (item?.parentShow?.tags && Array.isArray(item?.parentShow?.tags)) {
		item.parentShow.tags.forEach((tag: Tag) => {
			if (
				tag._type === "tag.city" &&
				!cityTags.some((t) => t._id === tag._id)
			) {
				cityTags.push(tag);
			}
		});
	}

	return cityTags;
}

function getItemNonCityTags(item: ContentItem) {
	const tags: Tag[] = [];

	const addTags = (sourceTags: Tag[] | undefined) => {
		if (Array.isArray(sourceTags)) {
			sourceTags.forEach((tag: Tag) => {
				if (tag._type !== "tag.city" && !tags.some((t) => t._id === tag._id)) {
					tags.push(tag);
				}
			});
		}
	};

	addTags(item?.tags);
	addTags(item?.parentShow?.tags);

	return tags;
}

function _checkImage(url: string): Promise<boolean> {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve(true);
		img.onerror = () => resolve(false);
		img.src = url;
	});
}

function loadArtworkUrl(item: ContentItem) {
	if (!item) return;
	const url = getSoundcloudArtwork(item);
	artworkUrls.value.set(item._id ?? "", url);
}

// Lifecycle
onMounted(() => {
	if (props.type === "shows") {
		visibleItems.value.forEach((item: ContentItem) => {
			loadArtworkUrl(item);
		});
	}
});

// Reset when items change
watch(
	() => props.items,
	() => {
		visibleItemCount.value = ITEMS_PER_PAGE;
	},
	{ deep: true },
);
</script>

<template>
	<div
		v-if="items && items.length > 0"
		:class="[
			'search-result-block',
			`search-result-block--${typeConfig?.cssClass}`,
		]"
	>
		<!-- Header with Category Pill -->
		<div class="search-result-block__header">
			<NuxtLink
				:to="type === 'shows' ? localePath('/shows') : localePath(`/${type}`)"
				class="search-result-block__header__link"
			>
				<h2
					class="search-result-block__pill"
					:class="`search-result-block__pill--${typeConfig?.color}`"
				>
					{{ title || typeConfig?.label }}
				</h2>
			</NuxtLink>
			<span class="search-result-block__count">({{ items.length }})</span>
		</div>

		<!-- Content Grid -->
		<div class="search-result-block__grid">
			<div
				v-for="item in visibleItems"
				:key="item._id"
				:class="['teaser-item', `teaser-item--${typeConfig?.cssClass}`]"
			>
				<!-- City Tags (displayed above image like in ModuleContentTeaser/ModuleContentGrid) -->
				<div
					v-if="getItemCityTags(item).length > 0"
					class="teaser-item__tags city-tags"
				>
					<span
						v-for="tag in getItemCityTags(item)"
						:key="tag._id"
						class="tag city"
					>
						{{ getI18nLabel(tag?.short) }}
					</span>
				</div>

				<!-- Image -->
				<NuxtLink
					v-if="item?.slug"
					:to="getItemRoute(item)"
					class="teaser-item__link"
				>
					<div class="teaser-item__image">
						<!-- Set with SoundCloud -->
						<template v-if="item._type === 'set'">
							<img
								v-if="item?.image?.asset?.url"
								:src="item.image.asset.url"
								:alt="item?.title || ''"
							>
							<div v-else-if="item?.soundcloud" class="track-artwork">
								<img
									v-if="artworkUrls.get(item._id)"
									:src="artworkUrls.get(item._id)"
									alt="Track Artwork"
								>
								<div v-else class="track-artwork-placeholder"/>
							</div>
							<img
								v-else-if="
									mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url
								"
								:src="mainStore.siteFallbacks.fallbackSet.image.asset.url"
								alt="Fallback"
							>
						</template>
						<!-- Other types -->
						<template v-else>
							<img
								v-if="getItemImage(item)?.asset?.url"
								:src="getItemImage(item).asset.url"
								:alt="item?.title || ''"
							>
							<img
								v-else-if="
									mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url
								"
								:src="mainStore.siteFallbacks.fallbackSet.image.asset.url"
								alt="Fallback"
							>
						</template>
					</div>
				</NuxtLink>

				<!-- Content -->
				<div class="teaser-item__content">
					<!-- Interactive section (date, play button) for Shows -->
					<section
						v-if="type === 'shows'"
						class="teaser-item__content__interactive"
					>
						<div
							v-if="item?.datetime || item?.publishedAt"
							class="teaser-item__date"
						>
							{{ formatDate(item.datetime || item.publishedAt) }}
						</div>
						<button
							v-if="item._type === 'set' && item?.soundcloud"
							class="play-button"
							@click.prevent="playTrack(item)"
						>
							<span class="sr-only">Play</span>
							<svg
								width="9"
								height="12"
								viewBox="0 0 9 12"
								fill="none">
								<path d="M9 6L0 11.1962L0 0.803847L9 6Z" fill="currentColor" />
							</svg>
						</button>
					</section>

					<!-- Show info for sets -->
					<div
						v-if="item?.parentShow && item._type === 'set'"
						class="teaser-item__content__show"
					>
						<!-- Only show parent show link if NOT no-show -->
						<NuxtLink
							v-if="
								item.parentShow?.title?.toLowerCase() !== 'no-show' &&
									item.parentShow?.slug
							"
							:to="localePath(`/shows/${item.parentShow.slug.current}`)"
							class="teaser-item__link"
						>
							<h3 class="teaser-item__title show-title">
								{{ item.parentShow.title }}
							</h3>
						</NuxtLink>
						<!-- If no-show: show only set title -->
						<h3
							v-else-if="
								item.parentShow?.title?.toLowerCase() === 'no-show' &&
									item?.title
							"
							class="teaser-item__title show-title"
						>
							{{ item.title }}
						</h3>

						<!-- Artists -->
						<div v-if="item.persons?.length > 0" class="show-artists">
							<h3
								v-for="(artist, index) in item.persons"
								:key="artist._id"
								class="teaser-item__artist"
							>
								<NuxtLink
									v-if="artist?.poolVisibility"
									:to="localePath(`/pool/${artist?.slug?.current}`)"
									class="teaser-item__link"
								>
									{{ artist.title
									}}{{ index < item.persons.length - 1 ? "," : "" }}&nbsp;
								</NuxtLink>
								<span v-else>
									{{ artist.title
									}}{{ index < item.persons.length - 1 ? "," : "" }}&nbsp;
								</span>
							</h3>
						</div>
					</div>

					<!-- Title for other content -->
					<NuxtLink
						v-if="item._type !== 'set'"
						:to="getItemRoute(item)"
						class="teaser-item__link"
					>
						<h3 class="teaser-item__title">
							{{ item?.title || item?.name }}
						</h3>
					</NuxtLink>

					<!-- Teaser text (for words) -->
					<RichText
						v-if="type === 'words' && item?.useTeaserText && item?.textTeaser"
						:blocks="parseI18nObj(item.textTeaser)"
					/>
					<RichText
						v-else-if="
							type === 'words' && !item?.useTeaserText && item?.text?.length > 0
						"
						:blocks="parseI18nObj(item.text)?.slice(0, 1)"
					/>

					<!-- Description (for pool) -->
					<RichText
						v-if="type === 'pool' && item?.description?.length > 0"
						:blocks="
							limitTextBlocks(parseI18nObj(item.description)?.slice(0, 1), 100)
						"
					/>

					<!-- Non-City Tags -->
					<div
						v-if="getItemNonCityTags(item).length > 0"
						class="teaser-item__tags tags"
					>
						<span
							v-for="tag in getItemNonCityTags(item)"
							:key="tag._id"
							class="tag"
						>
							{{ getI18nLabel(tag.title) }}
						</span>
					</div>
				</div>
			</div>
		</div>

		<!-- Load More Button -->
		<div v-if="hasMoreItems" class="search-result-block__load-more">
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
.search-result-block {
  min-width: calc(var(--page-max-width) + var(--big-margin));
  margin: 0 0 var(--large-margin) calc(var(--big-margin) * -0.5);
  margin-bottom: var(--first-content-distance);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--small-padding);
    margin-bottom: var(--mid-padding);
    padding: 0 calc(var(--big-margin) / 2);

    &__link {
      text-decoration: none;
      color: inherit;
    }
  }

  &__pill {
    display: inline-block;
    padding: var(--small-padding) var(--mid-padding);
    border-radius: 100px;
    font-size: var(--small-font-size);
    font-family: var(--font-text-semibold);
    text-transform: uppercase;
    margin: 0;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }

    &--pink {
      background-color: var(--color-pink);
      color: var(--color-bg);
    }

    &--blue {
      background-color: var(--color-blue);
      color: var(--color-bg);
    }

    &--green {
      background-color: var(--color-green);
      color: var(--color-bg);
    }
  }

  &__count {
    font-size: var(--small-font-size);
    opacity: 0.6;
  }

  /* Exactly matches content-grid__items from ModuleContentGrid */
  &__grid {
    width: 100%;
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
    padding: 0 calc(var(--big-margin) / 2);

    .load-more-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--small-padding);
      padding: var(--small-padding) var(--big-padding);
      background-color: transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: var(--font-text-semibold);
      background-color: var(--color-bg);
      border-radius: 100px;
      border: 0.09325rem solid var(--color-text);
      box-shadow: 0 0 0.5rem 0.09325rem var(--color-text);
      text-transform: uppercase;
      font-size: var(--small-font-size);

      &:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-text);
          color: var(--color-bg);
        }
      }

      svg {
        width: var(--base-font-size);
        height: var(--base-font-size);
        path {
          stroke: var(--color-text);
        }
      }
    }
  }

  /* Content-type based styling for sets/shows */
  &--sets {
    .teaser-item__tags.city-tags .tag.city {
      background-color: var(--color-pink);
      color: var(--color-white);
    }
    .play-button:hover {
      @media (min-width: 1024px) {
        background-color: var(--color-pink);
      }
    }
    .load-more-button {
      border-color: var(--color-pink);
      box-shadow: 0 0 0.5rem 0.09325rem var(--color-pink);

      &:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-pink);
          color: var(--color-bg);
        }
      }

      svg path {
        stroke: var(--color-pink);
      }
    }
  }

  /* Content-type based styling for words */
  &--words {
    .teaser-item__tags.city-tags .tag.city {
      background-color: var(--color-green);
      color: var(--color-white);
    }
    .load-more-button {
      border-color: var(--color-green);
      box-shadow: 0 0 0.5rem 0.09325rem var(--color-green);

      &:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-green);
          color: var(--color-bg);
        }
      }

      svg path {
        stroke: var(--color-green);
      }
    }
  }

  /* Content-type based styling for pool */
  &--pool {
    .teaser-item__tags.city-tags .tag.city {
      background-color: var(--color-blue);
      color: var(--color-white);
    }
    .teaser-item__image img {
      aspect-ratio: 3 / 4;
    }
    .load-more-button {
      border-color: var(--color-blue);
      box-shadow: 0 0 0.5rem 0.09325rem var(--color-blue);

      &:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-blue);
          color: var(--color-bg);
        }
      }

      svg path {
        stroke: var(--color-blue);
      }
    }
  }
}

/* Exactly matches .module-grid .grid-item from ModuleContentGrid */
.teaser-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  max-width: calc(100% / 3 - var(--big-margin) * 1.325);
  width: 100%;
  padding: 0 0 calc(var(--big-margin) / 2) 0;

  &:last-of-type {
    justify-self: flex-start;
    margin: 0 auto 0 0;
  }

  &__link {
    display: contents;
    text-decoration: none;
    color: inherit;
  }

  &__image {
    position: relative;
    overflow: hidden;

    img {
      width: 100%;
      height: auto;
      aspect-ratio: 1 / 1;
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
      background-color: var(--color-grey);
    }
  }

  &__content {
    width: 100%;
    display: flex;
    flex-flow: column wrap;
    justify-content: flex-start;
    align-items: stretch;
    flex-grow: 1;
    margin: var(--mid-padding) 0 0 0;
    gap: var(--mid-padding);

    .teaser-item__tags {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: flex-end;
      align-content: flex-end;
      gap: var(--small-margin);
      flex-grow: 1;
    }

    &__interactive {
      width: 100%;
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      align-items: center;

      .teaser-item__date {
        font-size: var(--small-font-size);
        text-transform: uppercase;
      }

      .play-button {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0 0 0 auto;
        color: transparent;
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

    &__show {
      min-height: calc(
        var(--base-font-size) * 1.15 + var(--base-font-size) +
          var(--mid-padding)
      );
    }
  }

  &__title,
  &__artist {
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

  &__tags {
    &.city-tags {
      display: flex;
      flex-wrap: wrap;
      gap: calc(var(--small-padding) / 2);
    }
  }
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .search-result-block {
    &__grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

@media (max-width: 480px) {
  .search-result-block__grid {
    grid-template-columns: 1fr;
  }
}

@media screen and (max-width: 900px) {
  .search-result-block .teaser-item__content {
    margin: var(--card-content-padding-y) 0 0 0;
    gap: var(--card-content-gap);
  }
}
</style>
