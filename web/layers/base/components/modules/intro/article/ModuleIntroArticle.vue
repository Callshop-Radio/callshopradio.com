<script setup lang="ts">
import { computed } from "vue";
import { useMainStore } from "~/stores/mainStore";
import type { Image, Tag } from "~/types/sanity";

const { locale: _locale, setLocale: _setLocale } = useI18n();
const localePath = useLocalePath();

// Typdefinitionen für Artikel
interface Article {
	_id?: string;
	_type?: string;
	title?: string;
	slug?: {
		current?: string;
	};
	image?: Image;
	datetime?: string;
	_updatedAt?: string;
	text?: unknown[];
	useTeaserText?: boolean;
	textTeaser?: unknown[];
	tags?: Tag[];
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
		article: Article;
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
	function getItemImage(item?: Article): Image | null {
		if (!item) return null;

		// Bild aus dem Artikel
		if (item.image) {
			return item.image;
		}

		// Fallback für Artikel
		return mainStore?.siteFallbacks?.fallbackArticle?.image;
	}

	return {
		getItemImage,
	};
};

// Funktion zum Bestimmen der passenden Route
function _getItemRoute(item) {
	if (!item?.slug) return "/";
	return localePath(`/words/${item?.slug?.current}`);
}

// Anwendung der Composables
const { getItemImage } = useImageManagement();

// Computed properties
const articleImage = computed(() => {
	const image = getItemImage(props.article);
	return image?.asset?.url || "";
});

const COVER_FLOW_TEASER_MAX_WORDS = 40;

const coverFlowTeaserBlocks = computed(() => {
	if (props.layout !== "cover-flow" || !props.article) return [];

	if (props.article.useTeaserText && props.article.textTeaser?.length) {
		return limitTextBlocksByWords(
			parseI18nObj(props.article.textTeaser || []),
			COVER_FLOW_TEASER_MAX_WORDS,
		);
	}

	if (props.article.text?.length) {
		const blocks = parseI18nObj(props.article.text || []);
		return limitTextBlocksByWords(
			Array.isArray(blocks) ? blocks.slice(0, 1) : [],
			COVER_FLOW_TEASER_MAX_WORDS,
		);
	}

	return [];
});
</script>

<template>
	<div
		v-if="article"
		class="article-content"
		:class="`article-content--${props.layout}`"
	>
		<div class="article-container">
			<!-- Bild/Media-Bereich -->
			<div class="article-media">
				<NuxtLink :to="getItemRoute(article)" class="grid-item__link">
					<img
						v-if="mediaActive && articleImage"
						:src="articleImage"
						alt="Article Image"
						class="article-image"
						loading="lazy"
					>
					<div v-else class="article-image-placeholder"/>
				</NuxtLink>
			</div>

			<!-- Tags auf dem Bild -->
			<div v-if="article?.tags?.length" class="article-tags tags">
				<button
					v-for="tag in article?.tags.slice(0, 3)"
					:key="tag._id"
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

			<!-- Content-Bereich -->
			<div class="article-info">
				<div v-if="article.useTeaserText || article.text" class="tags read-more">
					<NuxtLink :to="getItemRoute(article)" class="tag">
						Read More
					</NuxtLink>
				</div>

				<div class="article-info-container">
					<!-- Titel-Bereich -->
					<div class="article-header">
						<!-- Datum -->
						<!-- <div class="article-meta">
              <h3 class="article-date" v-if="article?.datetime">
                {{ formatDate(article.datetime) }}
              </h3>
              <h3 class="article-date" v-else-if="article?._updatedAt">
                {{ formatDate(article._updatedAt) }}
              </h3>
            </div> -->
						<div class="article-title-container">
							<NuxtLink
								:to="getItemRoute(article)"
								class="article__link article-title"
							>
								<h2 v-if="article?.title" class="article-title">
									{{ article?.title }}
								</h2>
							</NuxtLink>
						</div>
					</div>

					<!-- Artikel-Teaser -->
					<div
						v-if="props.layout === 'cover-flow' && coverFlowTeaserBlocks.length"
						class="article-teaser"
					>
						<RichText
							:value="article.textTeaser || article.text"
							class="rich-text"
							:blocks="coverFlowTeaserBlocks"
						/>
					</div>
					<div v-else-if="article.useTeaserText" class="article-teaser">
						<RichText
							v-if="article.textTeaser"
							:value="article.textTeaser"
							class="rich-text"
							:blocks="parseI18nObj(article.textTeaser || [])"
						/>
					</div>
					<div
						v-else-if="!article.useTeaserText && article.text"
						class="article-teaser"
					>
						<RichText
							v-if="article.textTeaser"
							:value="article.textTeaser"
							class="rich-text"
							:blocks="
								limitTextBlocks(
									parseI18nObj(article.text || [])?.slice(0, 1),
									100
								)
							"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.article-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 100%;
  background-color: var(--color-text);
  border-radius: 12px;
  border: 1px solid var(--color-text);
  overflow: hidden;
  padding: 0;
  height: auto;

  .article-container {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    border: none;
    border-radius: 0;

    .article-media {
      position: relative;
      overflow: hidden;
      order: 1;
      border-radius: 0;
      width: 100%;

      .article-image,
      .article-image-placeholder {
        width: 100%;
        height: auto;
        aspect-ratio: 3 / 1 !important;
        object-fit: cover;
        object-position: top;
        transition: transform 0.2s ease;
        max-width: none;
        max-height: none;

        @media (max-width: 900px) {
          aspect-ratio: 3 / 2 !important;
        }
      }
    }

    .article-tags {
      position: absolute;
      top: var(--base-padding);
      right: var(--base-padding);
      left: auto;
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-end;
      align-items: flex-start;
      gap: var(--small-padding);
      z-index: 10;
      pointer-events: none;
      max-width: calc(100% - var(--base-padding) * 2);

      .tag {
        pointer-events: all;
        flex-shrink: 0;
        background-color: var(--color-text);
        color: var(--color-bg);
      }
    }
  }

  .article-info {
    position: relative;
    width: 100%;
    background-color: var(--color-text);
    display: flex;
    flex-flow: column wrap;
    justify-content: flex-start;
    align-items: stretch;
    flex-grow: 1;
    gap: var(--big-padding);
    margin: 0;
    padding: var(--base-margin) var(--base-margin) var(--base-margin);
    border-bottom: none;
    order: 2;
    color: var(--color-bg);

    .read-more {
      position: absolute;
      top: 0;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 20;

      .tag {
        border: 1px solid var(--color-text);
        background-color: var(--color-bg);
        color: var(--color-text);
        padding: calc(var(--small-padding) / 2) var(--base-padding);
        font-size: var(--base-font-size);

        &:hover {
          background-color: var(--color-green);
          color: var(--color-bg);
          text-decoration: none;
        }
      }
    }

    &-container {
      width: 66%;
      gap: var(--big-padding);
      display: flex;
      flex-flow: column wrap;
      justify-content: flex-start;
      align-items: flex-start;

      @media (max-width: 900px) {
        width: 100%;
      }
    }

    .article-header {
      gap: var(--big-padding);
      .article-meta {
        .article-date {
          color: var(--color-bg);
        }
      }

      .article-title-container {
        a {
          width: 100%;
          h2 {
            font-size: var(--h1-size);
          }
        }
      }

      .article-title {
        font-size: var(--large-font-size);
        font-weight: 400;
        text-transform: uppercase;
        font-family: var(--font-text-regular);
        margin: 0;
        color: var(--color-bg);
      }
    }

    .article-teaser {
      color: var(--color-bg);
    }
  }
}

.article-content--cover-flow {
  width: 100%;
  max-width: 100%;
  min-height: var(--cover-flow-uniform-height, auto);
  height: var(--cover-flow-uniform-height, auto);
  border-radius: 12px;
  display: flex;
  flex-direction: column;

  .article-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    justify-content: flex-start;

    .article-media {
      flex-shrink: 0;

      .article-image,
      .article-image-placeholder {
        width: 100%;
        max-width: 100%;
        aspect-ratio: 3 / 2 !important;
        height: auto;
        max-height: none;
        object-fit: cover;
        object-position: top;
      }
    }

    .article-tags {
      top: var(--base-padding);
      right: var(--base-padding);
      max-width: calc(100% - var(--base-padding) * 2);
    }
  }

  .article-info {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    padding: var(--base-margin) var(--mid-padding);
    gap: var(--mid-padding);

    &-container {
      width: 100%;
      flex: 0 0 auto;
      gap: var(--mid-padding);
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }

    .article-header {
      gap: var(--mid-padding);
      flex-shrink: 0;

      .article-title-container a h2,
      .article-title {
        font-size: var(--base-font-size);
        font-family: var(--font-text-semibold);
        font-weight: 500;
        text-transform: uppercase;
        margin: 0;
      }
    }

    .article-teaser {
      flex: 0 0 auto;
      font-size: var(--base-font-size);
      line-height: 1.4;

      & > *,
      :deep(.rich-text),
      :deep(p),
      :deep(span) {
        margin: 0;
        font-size: inherit;
        line-height: inherit;
      }
    }

    .read-more .tag {
      font-size: var(--base-font-size);
    }
  }
}

@media screen and (max-width: 900px) {
  .article-content .article-info {
    gap: var(--card-content-gap);
    padding: var(--card-content-padding-y) var(--card-content-padding-x);

    .article-info-container,
    .article-header {
      gap: var(--card-content-gap);
    }
  }

  .article-content--cover-flow {
    .article-tags {
      top: var(--small-padding);
      right: var(--small-padding);
      max-width: calc(100% - var(--small-padding) * 2);
    }

    .article-info {
      padding: var(--card-content-padding-y) var(--card-content-padding-x);
      gap: var(--card-content-gap);

      .read-more .tag {
        font-size: var(--small-font-size);
        padding: calc(var(--small-padding) / 2) var(--small-padding);
      }

      &-container,
      .article-header {
        gap: var(--card-content-gap);
      }

      .article-teaser {
        font-size: var(--small-font-size);
      }
    }
  }
}
</style>