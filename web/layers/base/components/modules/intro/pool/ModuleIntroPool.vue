<script setup lang="ts">
import { computed } from "vue";
import { useMainStore } from "~/stores/mainStore";
import type { Image } from "~/types/sanity";

const { locale: _locale, setLocale: _setLocale } = useI18n();
const { getItemRoute } = useContentRoute();

// Typdefinitionen
interface Tag {
	_id?: string;
	_type?: string;
	title?: string | unknown;
	short?: string;
}

function _getTagLabel(tag: Tag): string {
	if (tag?.title?.[1]?.value) {
		return parseI18nObj(tag.title) as string;
	}
	if (Array.isArray(tag?.title)) {
		return tag.title[0]?.value ?? String(tag.title);
	}
	return String(tag?.title ?? "");
}

interface PoolItem {
	_id?: string;
	_type?: string;
	title?: string;
	name?: string;
	slug?: { current?: string };
	image?: Image;
	mainImage?: Image;
	location?: string;
	tags?: Tag[];
	bio?: unknown[];
	text?: unknown[];
	textTeaser?: unknown[];
	useTeaserText?: boolean;
	description?: unknown[];
	socials?: {
		instagram?: string;
		soundcloud?: string;
		nina?: string;
		bandcamp?: string;
		web?: string;
	};
}

// Props
const props = withDefaults(
	defineProps<{
		poolItem: PoolItem;
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
	function getItemImage(item?: PoolItem): Image | null {
		if (!item) return null;

		// Bild aus dem Item selbst
		if (item.image || item.mainImage) {
			return item.image || item.mainImage;
		}

		// Fallbacks je nach Content-Typ
		if (item._type === "person") {
			return mainStore?.siteFallbacks?.fallbackPerson?.image;
		} else if (item._type === "venue") {
			return mainStore?.siteFallbacks?.fallbackVenue?.image;
		}

		// Allgemeines Fallback
		return mainStore?.siteFallbacks?.fallbackPerson?.image;
	}

	// Computed Property für das Bild
	const itemImage = computed(() => {
		return getItemImage(props.poolItem);
	});

	return {
		itemImage,
	};
};

// Anwendung der Composables
const { itemImage } = useImageManagement();

// Formatierte Daten
const itemTitle = computed(() => {
	return props.poolItem?.title || props.poolItem?.name || "";
});

const _itemType = computed(() => {
	return props.poolItem?._type === "person" ? "Person" : "Venue";
});

const _itemLocation = computed(() => {
	return props.poolItem?.location || "";
});

const cityTags = computed(() =>
	(props.poolItem?.tags ?? []).filter((tag) => tag._type === "tag.city"),
);

const otherTags = computed(() =>
	(props.poolItem?.tags ?? []).filter((tag) => tag._type !== "tag.city"),
);

const COVER_FLOW_DESCRIPTION_MAX_WORDS = 20;

const coverFlowDescriptionBlocks = computed(() => {
	const item = props.poolItem;
	if (!item) return [];

	if (item.useTeaserText && item.textTeaser?.length) {
		return limitTextBlocksByWords(
			parseI18nObj(item.textTeaser),
			COVER_FLOW_DESCRIPTION_MAX_WORDS,
		);
	}

	if (item.text?.length) {
		const blocks = parseI18nObj(item.text || []);
		return limitTextBlocksByWords(
			Array.isArray(blocks) ? blocks.slice(0, 1) : [],
			COVER_FLOW_DESCRIPTION_MAX_WORDS,
		);
	}

	if (item.description?.length) {
		const blocks = parseI18nObj(item.description || []);
		return limitTextBlocksByWords(
			Array.isArray(blocks) ? blocks.slice(0, 1) : [],
			COVER_FLOW_DESCRIPTION_MAX_WORDS,
		);
	}

	if (
		!item.text &&
		item._type === "person" &&
		mainStore?.siteFallbacks?.fallbackPerson?.description?.length
	) {
		return limitTextBlocksByWords(
			parseI18nObj(mainStore.siteFallbacks.fallbackPerson.description)?.slice(
				0,
				1,
			),
			COVER_FLOW_DESCRIPTION_MAX_WORDS,
		);
	}

	if (
		!item.text &&
		item._type === "venue" &&
		mainStore?.siteFallbacks?.fallbackVenue?.description?.length
	) {
		return limitTextBlocksByWords(
			parseI18nObj(mainStore.siteFallbacks.fallbackVenue.description)?.slice(
				0,
				1,
			),
			COVER_FLOW_DESCRIPTION_MAX_WORDS,
		);
	}

	return [];
});
</script>

<template>
	<div
		v-if="poolItem && props.layout === 'cover-flow'"
		class="pool-content pool-content--cover-flow"
	>
		<div class="pool-main">
			<div class="set-info pool-info">
				<div class="set-info-container pool-info-container">
					<div class="set-header pool-header">
						<div class="set-show-title pool-show-title">
							<NuxtLink
								:to="getItemRoute(poolItem)"
								class="set__link pool-link"
								:aria-label="itemTitle"
							>
								<h2 v-if="itemTitle" class="set-title pool-title">
									{{ itemTitle }}
								</h2>
							</NuxtLink>
						</div>
					</div>
					<div
						v-if="cityTags.length || otherTags.length"
						class="set-tags pool-tags tags"
					>
						<button
							v-for="(tag, index) in cityTags"
							:key="tag._id || `city-${index}`"
							class="tag"
							type="button"
						>
							{{ getTagLabel(tag) }}
						</button>
						<button
							v-for="(tag, index) in otherTags.slice(
								0,
								Math.max(0, 3 - cityTags.length),
							)"
							:key="tag._id || `other-${index}`"
							class="tag"
							type="button"
						>
							{{ getTagLabel(tag) }}
						</button>
					</div>
					<div
						v-if="coverFlowDescriptionBlocks.length"
						class="pool-teaser"
					>
						<RichText :blocks="coverFlowDescriptionBlocks" />
					</div>
				</div>
			</div>
			<div class="pool-media">
				<NuxtLink
					:to="getItemRoute(poolItem)"
					class="pool-link"
					:aria-label="itemTitle"
				>
					<MediaImage
						v-if="mediaActive"
						:image="itemImage"
						:alt="itemTitle"
						class="pool-image"
					/>
					<div v-else class="pool-image pool-image-placeholder" />
				</NuxtLink>
			</div>
		</div>
	</div>
	<div v-else-if="poolItem" class="set-content pool-content">
		<div class="set-main pool-container">
			<!-- Tags-Icon -->
			<div v-if="poolItem?.tags?.length" class="set-tags pool-tags tags">
				<button
					v-for="(tag, index) in poolItem.tags"
					:key="tag._id || index"
					class="tag"
					type="button"
				>
					{{
						tag?.title?.[1]?.value
							? parseI18nObj(tag?.title)
							: tag?.title[0]?.value ?? tag.title
					}}
				</button>
			</div>
			<!-- Bild/Media-Bereich -->
			<div class="set-media pool-media">
				<NuxtLink
					:to="getItemRoute(poolItem)"
					class="pool-link"
					:aria-label="poolItem?.title || poolItem?.name"
				>
					<MediaImage
						:image="itemImage"
						:alt="poolItem?.title || poolItem?.name"
						class="set-image pool-image"
					/>
				</NuxtLink>
			</div>

			<!-- Content-Bereich -->
			<div class="set-info pool-info">
				<div class="set-info-container pool-info-container">
					<!-- Titel-Bereich -->
					<div class="set-header pool-header">
						<!-- Typ und Standort -->
						<div class="set-show-title pool-item-title">
							<NuxtLink
								:to="getItemRoute(poolItem)"
								class="pool-link"
								:aria-label="poolItem?.title || poolItem?.name"
							>
								<h2 class="set-title pool-title">
									{{ itemTitle }}
								</h2>
							</NuxtLink>
						</div>
					</div>
					<!-- Hier die Teaser-Text Logik einfügen, analog zum ContentSlider -->
					<RichText
						v-if="poolItem?.useTeaserText && poolItem?.textTeaser"
						:blocks="parseI18nObj(poolItem?.textTeaser)"
						class="pool-teaser"
					/>
					<RichText
						v-else-if="
							!poolItem?.useTeaserText &&
								poolItem?.text &&
								poolItem.text.length > 0
						"
						:blocks="parseI18nObj(poolItem?.text)?.slice(0, 1)"
						class="pool-teaser"
					/>
					<RichText
						v-else-if="
							!poolItem?.text &&
								poolItem?.description &&
								poolItem.description.length > 0 &&
								(poolItem.description[0]?.value || poolItem.description[1]?.value)
						"
						:blocks="
							limitTextBlocks(
								parseI18nObj(poolItem?.description)?.slice(0, 1),
								100
							)
						"
						class="pool-teaser"
					/>
					<RichText
						v-else-if="
							!poolItem?.text &&
								poolItem._type == 'person' &&
								mainStore?.siteFallbacks?.fallbackPerson?.description.length >
								0 &&
								(mainStore?.siteFallbacks?.fallbackPerson?.description?.[0]
									?.value ||
									mainStore?.siteFallbacks?.fallbackPerson?.description?.[1]
										?.value)
						"
						:blocks="
							limitTextBlocks(
								parseI18nObj(
									mainStore?.siteFallbacks?.fallbackPerson?.description
								)?.slice(0, 1),
								100
							)
						"
						class="pool-teaser"
					/>
					<RichText
						v-else-if="
							!poolItem?.text &&
								poolItem._type == 'venue' &&
								mainStore?.siteFallbacks?.fallbackVenue?.description.length > 0 &&
								(mainStore?.siteFallbacks?.fallbackVenue?.description?.[0]
									?.value ||
									mainStore?.siteFallbacks?.fallbackVenue?.description?.[1]
										?.value)
						"
						:blocks="
							limitTextBlocks(
								parseI18nObj(
									mainStore?.siteFallbacks?.fallbackVenue?.description
								)?.slice(0, 1),
								100
							)
						"
						class="pool-teaser"
					/>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.pool-content {
  width: 100%;
  max-width: var(--page-max-width);
  height: max-content;
  height: 100%;
  position: relative;

  .pool-tags {
    top: 0;
    right: 0;
    padding: var(--mid-padding);
    position: absolute;
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    gap: var(--base-padding);
  }

  .pool-container {
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

    .pool-media {
      order: 2;
      border-radius: 1.5625rem;
      width: 100%;
      height: 100%;
      max-width: 35.3125rem;
      aspect-ratio: 3 / 4;
      .pool-image,
      .pool-image-placeholder {
        width: 100%;
        object-fit: cover;
        height: 100%;
      }
    }
  }

  .pool-info {
    position: absolute;
    left: 0;
    bottom: 0;
    margin: 0;
    width: 100%;
    background-color: var(--color-text);
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--mid-margin);
    order: 1;
    padding: var(--mid-margin) var(--mid-margin) var(--big-margin)
      var(--mid-margin);
    border-bottom: 0.0625rem solid var(--color-text);
    shape-rendering: crispEdges;
    z-index: 10;
    height: calc(var(--h3-size) + var(--base-font-size) * 2 + var(--mid-margin) + var(--big-margin));

    .pool-type-icon {
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
      width: calc(100% - 4rem - var(--mid-margin));
    }

    .pool-header {
      display: flex;
      flex-flow: column wrap;
      justify-content: center;
      gap: var(--mid-padding);

      .pool-item-title {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
      }

      .pool-title {
        font-size: var(--h4-size);
        font-family: var(--font-text-semibold);
        font-weight: 500;
        text-transform: uppercase;
        width: 100%;
        color: var(--color-bg);
      }

      .pool-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .pool-type,
        .pool-location {
          font-size: var(--small-font-size);
          text-transform: uppercase;
        }
      }
    }
    .pool-teaser {
      & > * {
        color: var(--color-bg);
        margin: 0;
      }
    }
  }
}

.pool-content--cover-flow {
  width: 100%;
  max-width: 100%;

  .pool-main {
    width: 100%;
    overflow: hidden;
    border: 0.0625rem solid var(--color-text);
    border-radius: 1.5625rem;
    display: flex;
    flex-direction: column;
  }

  .pool-info {
    position: relative;
    order: 1;
    z-index: 2;
    left: auto;
    bottom: auto;
    width: 100%;
    margin: 0 0 -1.25rem;
    height: auto;
    flex-grow: 0;
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--mid-margin);
    background-color: var(--color-bg);
    border-bottom: none;
    border-radius: 1.5625rem 1.5625rem 0 0;
    padding: var(--mid-padding);
    padding-bottom: calc(var(--mid-padding) + 1.25rem);
  }

  .pool-info-container {
    display: flex;
    flex-flow: column wrap;
    justify-content: center;
    gap: var(--mid-padding);
    width: 100%;
  }

  .pool-info .pool-header {
    display: flex;
    flex-flow: column wrap;
    justify-content: center;
    gap: var(--mid-padding);

    .pool-title,
    .set-title {
      font-size: var(--base-font-size);
      font-family: var(--font-text-semibold);
      font-weight: 500;
      text-transform: uppercase;
      color: var(--color-text);
      width: 100%;
      margin: 0;
    }
  }

  .pool-tags {
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    gap: var(--base-padding);
    position: static;
    top: auto;
    right: auto;
    padding: 0;
    margin: 0;
  }

  .pool-teaser {
    margin: 0;
    padding: 0;
    color: var(--color-text);
    line-height: 1.4;

    & > *,
    :deep(.rich-text),
    :deep(p),
    :deep(span) {
      color: var(--color-text);
      margin: 0;
    }
  }

  .pool-show-title {
    width: 100%;

    .pool-link,
    .set__link {
      width: 100%;
      color: var(--color-text);
      text-decoration: none;
    }
  }

  .pool-media {
    order: 2;
    position: relative;
    width: 100%;
    max-width: 100%;
    aspect-ratio: 1 / 1;
    height: auto;
    border-radius: 0 0 1.5625rem 1.5625rem;
    overflow: hidden;

    .pool-image,
    :deep(img) {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: none;
      object-fit: cover;
      aspect-ratio: 1 / 1;
    }
  }
}

@media screen and (max-width: 900px) {
  .pool-content .pool-info {
    padding: var(--card-content-padding-y) var(--card-content-padding-x)
      var(--card-content-padding-y);

    .pool-info-container,
    .pool-header {
      gap: var(--card-content-gap);
    }
  }

  .pool-content--cover-flow {
    .pool-info {
      padding: var(--card-content-padding-y) var(--card-content-padding-x);
      padding-bottom: calc(var(--card-content-padding-y) + 1.25rem);
    }

    .pool-info-container,
    .pool-info .pool-header {
      gap: var(--card-content-gap);
    }

    .pool-teaser {
      font-size: var(--small-font-size);
    }
  }
}
</style>