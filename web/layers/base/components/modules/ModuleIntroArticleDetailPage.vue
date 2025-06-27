<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

const { locale, setLocale } = useI18n();
const localePath = useLocalePath();
const mainStore = useMainStore();

// Typdefinitionen
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
  content?: Object;
  slug?: {
    current?: string;
  };
  publishedAt?: string;
  _updatedAt?: string;
  authors?: Person[];
  tags?: any[];
  excerpt?: string;
}

// Props
const props = defineProps<{
  article: Article;
}>();

// Composable für Bild-Management
const useImageManagement = () => {
  // Helper-Funktion für Bild-Fetching und Fallbacks
  function getItemImage(item?: Article): Image | null {
    if (!item) return null;

    // Bild aus dem Item selbst
    if (item.image || item.mainImage) {
      return item.image || item.mainImage;
    }

    // Fallback für Articles
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

// Funktion zum Bestimmen der passenden Route für verschiedene Content-Typen
function getItemRoute(item) {
  if (!item || !item?.slug) return "/";

  switch (item?._type) {
    case "person":
    case "venue":
      return localePath(`/pool/${item?.slug?.current}`);

    case "set":
      // Prüfe, ob parentShow vorhanden ist
      if (item?.parentShow?.slug?.current) {
        return localePath(
          `/shows/${item.parentShow?.slug?.current}/${item?.slug?.current}`
        );
      }
      // Fallback falls parentShow nicht verfügbar ist
      return localePath(`/shows/${item?.slug?.current}`);

    case "article":
      return localePath(`/words/${item?.slug?.current}`);

    case "show":
      return localePath(`/shows/${item?.slug?.current}`);

    // Standard-Fallback
    default:
      return localePath(`/${item?._type}/${item?.slug?.current}`);
  }
}

// Composable für Artikel-spezifische Funktionalität
const useArticle = () => {
  const articleImageUrl = ref("");
  const { getItemImage } = useImageManagement();

  async function getArticleImage(item?: Article): Promise<string> {
    if (!item) return "";

    // Verwende das Bild aus dem Artikel
    const itemImage = getItemImage(item);
    if (itemImage?.asset?.url) {
      return itemImage.asset.url;
    }

    // Fallback auf Store-Fallback
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
    if (!item?.slug?.current) return;

    // Navigation zum vollständigen Artikel
    navigateTo(localePath(`/words/${item.slug.current}`));
  }

  return {
    articleImageUrl,
    loadArticleImageUrl,
    navigateToArticle,
  };
};

// Anwendung der Composables
const { getItemImage } = useImageManagement();
const { articleImageUrl, loadArticleImageUrl, navigateToArticle } = useArticle();

// Lebenszyklus-Hooks
onMounted(() => {
  loadArticleImageUrl();
});
</script>

<template>
  <div v-if="article" class="article-content">
    <div class="article-container">
      <!-- Bild/Media-Bereich -->
      <div class="article-media">
        <NuxtLink v-if="article" :to="getItemRoute(article)" class="grid-item__link">
          <img
            v-if="articleImageUrl"
            :src="articleImageUrl"
            :alt="article.title || 'Article Image'"
            class="article-image"
            loading="lazy"
          />
          <div
            v-else
            class="article-image-placeholder"
            @vue:mounted="loadArticleImageUrl"
          ></div>
        </NuxtLink>
      </div>

      <!-- Content-Bereich -->
      <div class="article-info">
        <!-- Read-Button für Artikel -->
        <button
          @click="navigateToArticle"
          class="read-button"
          aria-label="Read Article"
          type="button"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M2 3h12v1H2V3zm0 3h12v1H2V6zm0 3h12v1H2V9zm0 3h8v1H2v-1z"
              fill="currentColor"
            />
          </svg>
        </button>

        <div class="article-info-container">
          <!-- Titel-Bereich -->
          <div class="article-header">
            <!-- Datum -->
            <div class="article-meta">
              <h3 class="article-date" v-if="article?.publishedAt">
                {{ formatDate(article.publishedAt) }}
              </h3>
              <h3 class="article-date" v-else-if="article?._updatedAt">
                {{ formatDate(article._updatedAt) }}
              </h3>
            </div>
            <div class="article-title-section">
              <NuxtLink
                v-if="article?.title"
                :to="localePath(`/words/${article?.slug?.current}`)"
                class="article__link article-title-link"
              >
                <h2 class="article-title">
                  {{ article.title }}
                </h2>
              </NuxtLink>
              <div v-if="article?.authors?.length">
                <h3
                  v-for="(author, index) in article.authors"
                  :key="author._key"
                  class="article__author"
                >
                  <NuxtLink
                    v-if="author?.poolVisibility"
                    :to="localePath(`/pool/${author?.slug?.current}`)"
                    class="article__author"
                  >
                    {{ author.title
                    }}{{ index < article.authors.length - 1 ? "," : "" }}&nbsp;
                  </NuxtLink>
                  <span class="article__author" v-else>
                    {{ author.title
                    }}{{ index < article.authors.length - 1 ? "," : "" }}&nbsp;
                  </span>
                </h3>
              </div>
            </div>
          </div>
          
          <!-- Excerpt -->
          <div v-if="article?.excerpt" class="article-excerpt">
            <p>{{ article.excerpt }}</p>
          </div>

          <!-- Tags -->
          <div v-if="article?.tags?.length" class="article-tags tags">
            <button
              v-for="tag in article?.tags"
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
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.article-content {
  width: max-content;
  height: max-content;
  margin: 0 auto;
  width: 100%;
  @media screen and (max-width: 900px) {
    padding: 0 var(--big-margin);
  }

  .article-container {
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

    .article-media {
      order: 2;
      border-radius: 1.5625rem;
      width: 100%;
      height: 100%;
      max-width: 35.3125rem;
      max-height: 35.3125rem;
      @media screen and (max-width: 900px) {
        max-width: 100%;
        max-height: 100%;
      }
      @media screen and (min-width: 900px) {
        min-width: 35.3125rem;
      }
      .article-image,
      .article-image-placeholder {
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        background-color: var(--color-grey);
        max-width: 35.3125rem;
        max-height: 35.3125rem;
        @media screen and (max-width: 900px) {
          max-width: 100%;
          max-height: 100%;
        }
      }
    }
  }

  .article-info {
    left: 0;
    margin: 0;
    width: 100%;
    background-color: var(--color-bg);
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    align-items: flex-start;
    flex-grow: 1;
    gap: var(--mid-margin);
    order: 1;
    padding: var(--mid-padding);
    border-bottom: 0.0625rem solid var(--color-text);
    shape-rendering: crispEdges;
    z-index: 10;

    .read-button {
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

    .article-tags {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      gap: var(--base-padding);
    }

    &-container {
      display: flex;
      flex-flow: column wrap;
      justify-content: flex-start;
      gap: var(--mid-padding);
      width: calc(100% - 4rem - var(--mid-margin));
    }

    .article-header {
      display: flex;
      flex-flow: column wrap;
      justify-content: flex-start;
      gap: var(--mid-padding);

      .article-title-section {
        display: flex;
        flex-flow: column wrap;
        justify-content: flex-start;
        gap: var(--base-padding);
        
        .article-title-link {
          width: max-content;
        }
        
        div {
          width: 100%;
          display: flex;
          flex-flow: row wrap;
          justify-content: flex-start;
        }
      }

      .article-title,
      .article__author {
        font-size: var(--base-font-size);
        font-family: var(--font-text-semibold);
        font-weight: 500;
        text-transform: uppercase;
        a,
        &a {
          cursor: pointer;
        }
      }

      .article-title {
        width: 100%;
        font-size: var(--large-font-size);
        line-height: 1.2;
      }

      .article__author {
        font-size: var(--base-font-size);
      }

      .article-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .article-date {
          font-size: var(--small-font-size);
          text-transform: uppercase;
        }
      }
    }

    .article-excerpt {
      p {
        font-size: var(--base-font-size);
        line-height: 1.4;
        color: var(--color-text);
        margin: 0;
      }
    }
  }
}
</style>
