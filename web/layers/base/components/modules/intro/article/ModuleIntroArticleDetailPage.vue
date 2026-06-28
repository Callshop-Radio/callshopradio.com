<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

const { locale, setLocale: _setLocale } = useI18n();
const { navigateToPath } = useAppPath();
const mainStore = useMainStore();

// Type definitions
interface Image {
	asset?: {
		url?: string;
	};
}

interface Person {
	_key?: string;
	title?: string;
	slug?: {
		current?: string;
	};
	poolVisibility?: boolean;
}

interface Article {
	_id?: string;
	_type?: string;
	title?: string;
	image?: Image;
	mainImage?: Image;
	content?: object;
	text?: unknown[];
	slug?: {
		current?: string;
	};
	publishedAt?: string;
	_updatedAt?: string;
	authors?: Person[];
	tags?: import("~/types/sanity").Tag[];
	excerpt?: string;
}

// Props
const props = defineProps<{
	article: Article;
}>();

// Composable for image management
const useImageManagement = () => {
	// Helper function for image fetching and fallbacks
	function getItemImage(item?: Article): Image | null {
		if (!item) return null;

		// Image from the item itself
		if (item.image || item.mainImage) {
			return item.image || item.mainImage || null;
		}

		// Fallback for articles
		return mainStore?.siteFallbacks?.fallbackArticle?.image;
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
		getItemImage,
		checkImage,
	};
};

// Composable for article-specific functionality
const useArticle = () => {
	const articleImageUrl = ref("");
	const { getItemImage } = useImageManagement();

	async function getArticleImage(item?: Article): Promise<string> {
		if (!item) return "";

		// Use the image from the article
		const itemImage = getItemImage(item);
		if (itemImage?.asset?.url) {
			return itemImage.asset.url;
		}

		// Fall back to store fallback
		const storeFallbackUrl =
			mainStore?.siteFallbacks?.fallbackArticle?.image?.asset?.url;

		if (storeFallbackUrl) {
			return storeFallbackUrl;
		}

		return "";
	}

	async function loadArticleImageUrl() {
		if (!props.article) return;
		try {
			const url = await getArticleImage(props.article);
			articleImageUrl.value = url;
		} catch (error) {
			console.error("Fehler beim Laden des Artikel-Bildes:", error);
		}
	}

	function navigateToArticle() {
		const item = props.article;
		if (!item) return;

		navigateToPath(item?.path);
	}

	return {
		articleImageUrl,
		loadArticleImageUrl,
		navigateToArticle,
	};
};

// Applying the composables
const { getItemImage: _getItemImage } = useImageManagement();
const {
	articleImageUrl,
	loadArticleImageUrl,
	navigateToArticle: _navigateToArticle,
} = useArticle();

// Lifecycle hooks
onMounted(() => {
	loadArticleImageUrl();
});

const cityTags = computed(() => {
	return (
		props.article?.tags?.filter(
			(tag: import("~/types/sanity").Tag) => tag._type === "tag.city",
		) || []
	);
});

const otherTags = computed(() => {
	return (
		props.article?.tags?.filter(
			(tag: import("~/types/sanity").Tag) => tag._type !== "tag.city",
		) || []
	);
});

// Article Language Switcher
const articleLocale = ref(locale.value);

watch(locale, (newVal: string) => {
	articleLocale.value = newVal;
});

const availableLocales = computed(() => {
	if (Array.isArray(props.article?.text)) {
		return props.article.text.map(
			(t: { _key?: string; language?: string }) => t.language ?? t._key,
		);
	}
	return [];
});

const currentArticleText = computed(() =>
	parseI18nObj(props.article?.text, articleLocale.value),
);
</script>

<template>
	<div class="article-media">
		<img
			v-if="articleImageUrl"
			:src="articleImageUrl"
			:alt="article.title || 'Article Image'"
			class="article-image"
			loading="lazy"
		>
		<!-- Tags -->
		<div v-if="cityTags.length" class="article-category tags">
			<button
				v-for="(tag, index) in cityTags"
				:key="tag._id || index"
				class="tag"
				type="button"
			>
					{{ getI18nLabel(tag?.title) }}
			</button>
		</div>
		<div
			v-else
			class="article-image-placeholder"
			@vue:mounted="loadArticleImageUrl"
		/>
		<div class="article-tags">
				<IntroSocialLinks :socials="article?.socials" />
			<div v-if="otherTags.length" class="tags article-content-tags">
				<button
					v-for="(tag, index) in otherTags"
					:key="tag._id || index"
					class="tag"
					type="button"
				>
					{{ getI18nLabel(tag?.title) }}
				</button>
			</div>
		</div>
	</div>
	<div v-if="article" class="article-content">
		<div class="article-container">
			<!-- Image/media area -->
			<!-- Content area -->
			<div class="article-info">
				<div class="article-info-container">
					<!-- Title area -->
					<div class="article-header">
						<div class="article-title-section">
							<h2 class="article-title">
								{{ article.title }}
							</h2>
							<h3 v-if="article?.publishedAt" class="article-date">
								{{ formatDate(article.publishedAt) }}
							</h3>
							<h3 v-else-if="article?._updatedAt" class="article-date">
								{{ formatDate(article._updatedAt) }}
							</h3>
							<div v-if="article?.authors?.length">
								<h3
									v-for="(author, index) in article.authors"
									:key="author._key"
									class="article__author"
								>
									<ElementsContentLink
										v-if="author?.poolVisibility"
										:pool="author"
										class="article__author"
									>
										{{ author.title
										}}{{ index < article.authors.length - 1 ? "," : "" }}&nbsp;
									</ElementsContentLink>
									<span v-else class="article__author">
										{{ author.title
										}}{{ index < article.authors.length - 1 ? "," : "" }}&nbsp;
									</span>
								</h3>
							</div>
						</div>
					</div>
					<div v-if="article?.text" class="article-text-container">
						<RichText class="article-text" :blocks="currentArticleText" />
						<div class="article-language-switcher">
							<button
								v-for="loc in ['en', 'de']"
								:key="loc"
								class="lang-btn"
								:class="{ 'lang-btn--active': articleLocale === loc }"
								:disabled="!availableLocales.includes(loc)"
								@click="articleLocale = loc"
							>
								{{ loc.toUpperCase() }}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.article-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--content-gap) var(--mid-padding) 0;
  box-sizing: border-box;
}

.article-container {
  width: 100%;
  max-width: var(--page-max-width);
}

.article-media {
  position: relative;
  overflow: hidden;
  width: 100svw;
  height: calc(
    100svh - var(--nav-height) - var(--big-margin) - var(--small-padding) / 2
  );
  max-height: 900px;
  display: flex;
  flex-flow: column;
  justify-content: flex-end;
  align-items: center;
  padding: 0;
  z-index: 99999;
  img {
    position: absolute;
    width: 100%;
    height: calc(
      100svh - var(--nav-height) - var(--big-margin) - var(--small-padding) / 2
    );
    max-height: 900px;
    object-fit: cover;
  }
  .article-category {
    position: relative;
    max-width: var(--page-max-width);
    width: 100%;
    margin: 0 auto;
    padding: 0 var(--mid-padding);
    box-sizing: border-box;
    .tag {
      background-color: var(--color-green);
      border: none;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      border-top-right-radius: 8px;
      border-top-left-radius: 8px;
      padding: calc(var(--small-padding) / 1.5) calc(var(--base-padding) * 1.5);
      font-size: var(--base-font-size);
    }
  }
  .article-tags {
    position: absolute;
    display: flex;
    flex-flow: column wrap;
    justify-content: flex-end;
    align-items: flex-end;
    bottom: var(--big-padding);
    right: var(--big-padding);
    gap: var(--small-padding);
    .article-content-tags {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-end;
      align-items: flex-end;
      gap: var(--small-padding);
      .tag {
        background-color: var(--color-green);
        border-color: var(--color-green);
      }
    }
  }
}

.article-title-section {
  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto var(--big-margin);
  .article-title {
    font-size: var(--h1-size);
    font-family: var(--font-text-medium);
    margin: 0 0 var(--base-padding);
  }
  .article-date {
    font-size: var(--base-font-size);
    font-family: var(--font-text-regular);
    color: var(--color-green);
    margin-bottom: var(--base-padding);
  }
}

.article-text-container {
  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  position: relative;

  .article-language-switcher {
    position: relative;
    display: flex;
    align-items: center;
    width: 70px;
    height: calc(var(--base-font-size) + var(--small-padding));
    padding: 4px;
    background: var(--color-text);
    backdrop-filter: blur(5px);
    border-radius: 30px;
    max-height: calc(var(--base-font-size) + var(--small-padding) * 2);
    margin: 0 var(--base-margin);

    .lang-btn {
      flex: 1;
      position: relative;
      z-index: 2;
      height: 100%;
      border: none;
      border-radius: 24px;
      background: transparent;
      color: var(--color-bg);
      font-weight: 400;
      font-size: var(--small-font-size);
      font-family: var(--font-text-medium);
      cursor: pointer;
      transition: color 0.2s ease;
      user-select: none;
      text-transform: uppercase;
      padding: 0;

      &--active {
        color: black;
        background-color: var(--color-green);
      }

      &:disabled {
        cursor: no-drop;
      }

      &:hover:not(&--active):not(:disabled) {
        cursor: pointer;
      }
    }

    /* The slider thumb */
    &::after {
      content: "";
      position: absolute;
      top: 2px;
      width: calc(50% - 4px);
      max-height: calc(var(--base-font-size) - var(--small-padding) * 2);
      height: 100%;
      background-color: var(--color-green);
      border-radius: 24px;
      transition: transform 0.2s ease;
      z-index: 1;
    }

    /* Position of the slider thumb when the second button is active */
    &:has(.lang-btn:nth-child(2).lang-btn--active)::after {
      transform: translateX(100%);
    }
  }
}

@media screen and (max-width: 900px) {
  .article-media {
    width: 100vw;
    max-width: 100vw;
    margin-inline: calc(50% - 50vw);
    height: 50vh;
    max-height: 50vh;
    padding: 0;

    img,
    .article-image-placeholder {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      max-height: 50vh;
      object-fit: cover;
      object-position: center;
    }

    .article-category {
      z-index: 2;
      padding: 0 var(--mid-padding);
    }

    .article-tags {
      bottom: var(--base-padding);
      right: var(--base-padding);
      gap: var(--small-padding);
    }
  }

  .article-content {
    padding: var(--content-gap) var(--mid-padding) 0;
  }

  .article-title-section {
    width: 100%;
    margin: 0 auto var(--big-margin);
    padding: 0;

    .article-title {
      font-size: var(--h2-size);
    }
  }

  .article-text-container {
    flex-direction: column;
    gap: var(--base-margin);

    .article-language-switcher {
      margin: 0;
      align-self: flex-start;
    }
  }
}
</style>
