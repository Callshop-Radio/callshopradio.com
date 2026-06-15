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
}

// Props
const props = defineProps<{
	poolItem: PoolItem;
}>();

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
</script>

<template>
	<div v-if="poolItem" class="set-content pool-content">
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
</style>