<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useMainStore } from "~/stores/mainStore";

const { locale, setLocale } = useI18n();
const localePath = useLocalePath();

// Typdefinitionen für Artikel
interface Image {
  asset?: {
    url?: string;
  };
}

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
  text?: any[];
  useTeaserText?: boolean;
  textTeaser?: any[];
  tags?: any[];
  socials?: {
    instagram?: string;
    soundcloud?: string;
    nina?: string;
    bandcamp?: string;
    web?: string;
  };
}

// Props
const props = defineProps<{
  article: Article;
}>();

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
function getItemRoute(item) {
  if (!item || !item?.slug) return "/";
  return localePath(`/words/${item?.slug?.current}`);
}

// Anwendung der Composables
const { getItemImage } = useImageManagement();

// Computed properties
const articleImage = computed(() => {
  const image = getItemImage(props.article);
  return image?.asset?.url || "";
});
</script>

<template>
  <div v-if="article" class="article-content">
    <div class="article-container">
      <!-- Bild/Media-Bereich -->
      <div class="article-media">
        <NuxtLink :to="getItemRoute(article)" class="grid-item__link">
          <img
            v-if="articleImage"
            :src="articleImage"
            alt="Article Image"
            class="article-image"
            loading="lazy"
          />
          <div v-else class="article-image-placeholder"></div>
        </NuxtLink>
      </div>

      <!-- Content-Bereich -->
      <div class="article-info">
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
          <div v-if="article.useTeaserText" class="article-teaser">
            <div class="tags read-more">
              <NuxtLink :to="getItemRoute(article)" class="tag">
                Read More
              </NuxtLink>
            </div>
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
            <div class="tags read-more">
              <NuxtLink :to="getItemRoute(article)" class="tag">
                Read More
              </NuxtLink>
            </div>
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

          <!-- Tags -->
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
        transition: transform 0.3s ease;
        max-width: none;
        max-height: none;
      }
    }
  }

  .article-info {
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
      right: calc(17% - var(--base-margin));
      transform: translate(0%, -100%);
      .tag {
        background-color: var(--color-bg);
        color: var(--color-text);
        padding: calc(var(--small-padding) / 2) var(--big-padding);
        font-size: var(--base-font-size);
        &:hover {
          background-color: var(--color-green);
          color: var(--color-bg);
          text-decoration: none;
        }
      }
    }

    .article-tags {
      position: absolute;
      top: var(--big-padding);
      right: var(--big-padding);
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: flex-end;
      align-content: flex-end;
      gap: var(--small-margin);
      flex-grow: 1;
      z-index: 10;

      .tag {
        background-color: var(--color-text);
        color: var(--color-bg);
      }
    }

    &-container {
      width: 66%;
      gap: var(--big-padding);
      display: flex;
      flex-flow: column wrap;
      justify-content: flex-start;
      align-items: flex-start;
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
</style>