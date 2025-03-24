<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useMainStore } from "~/stores/mainStore";

// Typdefinitionen
interface Image {
  asset?: {
    url?: string;
  };
}

interface ContentReference {
  _id?: string;
  _type?: string;
  title?: string;
  image?: Image;
  mainImage?: Image;
  parentShow?: {
    image?: Image;
  };
  datetime?: string;
  _updatedAt?: string;
  useTeaserText?: boolean;
  textTeaser?: any[];
  text?: any[];
  description?: any[];
  bio?: any[];
  tags?: any[];
  soundcloud?: {
    tracks?: Array<{
      id?: string;
      artwork_url?: string;
      permalink_url?: string;
    }>;
  };
}

interface Link {
  title?: string;
  [key: string]: any;
}

interface Module {
  title?: string;
  text?: any[];
  layout?: string;
  contentReference?: ContentReference;
  link?: Link;
  type?: string;
}

// Props
const props = defineProps<{
  module: Module;
}>();

// Store
const mainStore = useMainStore();

// Composable für Bild-Management
const useImageManagement = () => {
  // Helper-Funktion für Bild-Fetching und Fallbacks
  function getItemImage(item?: ContentReference): Image | null {
    if (!item) return null;

    // Bild aus dem Item selbst
    if (item.image || item.mainImage) {
      return item.image || item.mainImage;
    }

    // Fallbacks je nach Content-Typ
    const itemType = item._type || "";

    switch (itemType) {
      case "person":
        return mainStore?.siteFallbacks?.fallbackPerson?.image;
      case "venue":
        return mainStore?.siteFallbacks?.fallbackVenue?.image;
      case "show":
        return mainStore?.siteFallbacks?.fallbackShow?.image;
      case "set":
        return mainStore?.siteFallbacks?.fallbackSet?.image;
      case "word":
      case "article":
        return mainStore?.siteFallbacks?.fallbackArticle?.image;
      default:
        // Allgemeines Fallback-Bild
        return mainStore?.siteFallbacks?.fallbackPerson?.image;
    }
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

// Composable für SoundCloud-Funktionalität
const useSoundCloud = () => {
  const artworkUrl = ref("");
  const { checkImage } = useImageManagement();

  async function getSoundcloudArtwork(
    item?: ContentReference
  ): Promise<string> {
    if (!item) return "";

    // Definiere die Fallback-URLs explizit
    const parentShowImageUrl = item?.parentShow?.image?.asset?.url;
    const storeFallbackUrl =
      mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url;
    const artworkUrl = item?.soundcloud?.tracks?.[0]?.artwork_url;

    // Versuche zunächst das SoundCloud-Artwork
    if (artworkUrl) {
      const originalUrl = artworkUrl.replace("-large", "-original");
      try {
        const exists = await checkImage(originalUrl);
        if (exists) {
          return originalUrl;
        }
      } catch (error) {
        console.error("Fehler beim Laden des SoundCloud-Artworks:", error);
      }
    }

    // SoundCloud-Artwork existiert nicht, verwende Fallbacks
    if (parentShowImageUrl) {
      return parentShowImageUrl;
    }

    if (storeFallbackUrl) {
      return storeFallbackUrl;
    }

    return "";
  }

  async function loadArtworkUrl() {
    if (!props.module?.contentReference) return;
    try {
      const url = await getSoundcloudArtwork(props.module.contentReference);
      artworkUrl.value = url;
    } catch (error) {
      console.error("Fehler beim Laden des Artwork-URLs:", error);
    }
  }

  function playTrack() {
    const item = props.module?.contentReference;
    if (!item?.soundcloud?.tracks?.[0]) return;

    const track = item.soundcloud.tracks[0];

    // Sicherstellen, dass permalink_url gesetzt ist
    if (!track.permalink_url && track.id) {
      track.permalink_url = `https://api.soundcloud.com/tracks/${track.id}`;
    }

    // Track im Store speichern
    mainStore.currentTrack = track;
  }

  return {
    artworkUrl,
    loadArtworkUrl,
    playTrack,
  };
};

// Anwendung der Composables
const { getItemImage } = useImageManagement();
const { artworkUrl, loadArtworkUrl, playTrack } = useSoundCloud();

// Computed Properties
const contentType = computed<string | null>(() => {
  if (!props.module?.contentReference) return null;
  return props.module.contentReference._type;
});

const layoutClass = computed<string>(() => {
  return `layout-${props.module?.contentReference?._type || "default"}`;
});

const isAudioContent = computed<boolean>(() => {
  return contentType.value === "set";
});

// Lebenszyklus-Hooks
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
        <MediaImage
          v-if="getItemImage(module.contentReference) && !isAudioContent"
          :image="getItemImage(module.contentReference)"
          class="hero-entry-image"
        />
        <img
          v-else-if="isAudioContent && artworkUrl"
          :src="artworkUrl"
          alt="Audio Artwork"
          class="hero-entry-image track-artwork"
          loading="lazy"
        />
        <div
          v-else-if="isAudioContent"
          class="track-artwork-placeholder"
          @vue:mounted="loadArtworkUrl"
        ></div>
      </div>
      <div class="graphics-behind">
          <AnimatedGradient class="animated-gradient" />
          <AnimatedLogoBackground class="animated-logo-background" />
        </div>
      <!-- Content-Bereich -->
      <div class="hero-entry-content">
        <!-- Play-Button für Audio-Inhalte -->
        <button
          v-if="isAudioContent"
          @click="playTrack"
          class="play-button"
          aria-label="Play Audio"
          type="button"
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
              <h3 class="hero-date" v-if="module.contentReference?.datetime">
                {{ formatDate(module.contentReference.datetime) }}
              </h3>
              <h3
                class="hero-date"
                v-else-if="module.contentReference?._updatedAt"
              >
                {{ formatDate(module.contentReference._updatedAt) }}
              </h3>
            </div>
            <div
              class="hero-entry-show-title"
              v-if="module?.contentReference?._type == 'set'"
            >
              <h2
                v-if="module?.contentReference?.parentShow?.title"
                class="hero-entry-title"
              >
                {{ module?.contentReference?.parentShow?.title }}
              </h2>
              <h3
                v-for="(artist, index) in module?.contentReference?.persons"
                :key="artist._key"
                class="hero-entry-show-artist-artist"
              >
                {{ artist?.title
                }}{{
                  index < module?.contentReference?.persons.length - 1
                    ? ","
                    : ""
                }}&nbsp;
              </h3>
            </div>
            <h2 v-if="module.title" class="hero-entry-title">
              {{ module.title }}
            </h2>
            <h2
              v-else-if="
                module.contentReference?.title &&
                module?.contentReference?._type != 'set'
              "
              class="hero-entry-title"
            >
              {{ module.contentReference.title }}
            </h2>
          </div>

          <!-- Text-Bereich -->
          <div
            class="hero-entry-text"
            v-if="module?.contentReference?._type != 'set'"
          >
            <!-- Module-Text wenn vorhanden -->
            <RichText
              v-if="module.text && module.text.length > 0"
              :blocks="module.text"
              class="module-text"
            />

            <!-- Content-Beschreibung als Fallback -->
            <template v-else>
              <RichText
                v-if="
                  module.contentReference?.useTeaserText &&
                  module.contentReference?.textTeaser
                "
                :blocks="parseI18nObj(module.contentReference.textTeaser)"
              />
              <RichText
                v-else-if="
                  !module.contentReference?.useTeaserText &&
                  module.contentReference?.text &&
                  module.contentReference.text.length > 0
                "
                :blocks="parseI18nObj(module.contentReference.text)"
              />
              <RichText
                v-else-if="
                  module.contentReference?.description &&
                  module.contentReference.description.length > 0 &&
                  (module.contentReference.description[0]?.value ||
                    module.contentReference.description[1]?.value)
                "
                :blocks="parseI18nObj(module.contentReference.description)"
              />
              <RichText
                v-else-if="
                  module.contentReference?.bio &&
                  module.contentReference.bio.length > 0
                "
                :blocks="parseI18nObj(module.contentReference.bio)"
              />
            </template>
          </div>

          <!-- Tags-Bereich -->
          <div
            v-if="module.contentReference?.tags?.length"
            class="hero-entry-tags tags"
          >
            <button
              v-for="tag in module.contentReference.tags"
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
        <!-- Link-Bereich -->
        <!-- <div v-if="module.link" class="hero-entry-actions">
          <NuxtLink 
            :link="module.link" 
            class="hero-entry-link"
            :aria-label="`Link zu ${module.link.title || 'weiteren Informationen'}`"
          >
            {{ module.link.title || 'Mehr erfahren' }}
          </NuxtLink>
        </div> -->
      </div>
      <div class="graphics-front">
          <AnimatedLogo class="animated-logo" />
        </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.module-hero-entry {
  width: 100%;
  max-width: var(--page-max-width);
  min-height: 35.3125rem;
  height: max-content;
  position: relative;
  isolation: isolate; 

  .graphics-behind {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2;
    .animated-logo-background {
      width: 575px;
      height: 415px;
      position: absolute;
      right: calc(var(--big-margin) * 2);
      top: calc(35.3125rem - var(--big-margin)* 2 + var(--mid-margin) + 0.625rem);
      transform: translate(33%,-100%);
      z-index: 0;
    }
    .animated-gradient {
      position: absolute;
      top: -33%;
      left: -45%;
      width: 110%;
      height: 110%;
    }
  }
  .graphics-front {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 999;
    .animated-logo {
      width: 575px;
      height: 415px;
      position: absolute;
      right: calc(var(--big-margin) * 2);
      top: calc(35.3125rem - var(--big-margin)* 2 + var(--mid-margin) + var(--menu-text-size) / 2);
      transform: translate(33%,-100%);
      z-index: 0;
    }
  }
  
  &.layout-set {
    .hero-entry-container {
      width: 100%;
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-items: center;
      position: relative;
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }

      .hero-entry-media {
        border-radius: 1.5625rem;
        .track-artwork,
        .track-artwork-placeholder {
          width: 100%;
          aspect-ratio: 1 / 1;
          object-fit: cover;
          background-color: var(--color-grey);
          max-width: 35.3125rem;
          max-height: 35.3125rem;
        }
      }
    }
  }

  &.layout-person,
  &.layout-venue {
    .hero-entry-container {
      width: 100%;
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-items: center;
      position: relative;
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
      .hero-entry-content-container {
        max-width: 24.8125rem;
      }

      .hero-entry-content {
        top: 0;
      }
      .hero-entry-media {
        border-radius: 1.25rem;
        .hero-entry-image {
          width: 100%;
          aspect-ratio: 3 / 2;
          object-fit: cover;
          background-color: var(--color-grey);
          max-width: 35.3125rem;
          max-height: 35.3125rem;
          height: 100%;
        }
      }
      .hero-entry-header {
        .hero-entry-title {
          font-size: var(--large-font-size);
          font-family: var(--font-text-semibold);
          font-weight: 500;
        }
      }
      .hero-entry-text {
        .module-text {
        }
      }
    }
  }

  &.layout-article {
    .hero-entry-container {
      width: 100%;
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-items: center;
      position: relative;
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
      .hero-entry-content-container {
        max-width: 24.8125rem;
      }

      .hero-entry-content {
        top: 0;
      }
      .hero-entry-media {
        border-radius: 1.25rem;
        .hero-entry-image {
          width: 100%;
          aspect-ratio: 3 / 2;
          object-fit: cover;
          background-color: var(--color-grey);
          max-width: 35.3125rem;
          max-height: 35.3125rem;
        }
      }
      .hero-entry-header {
        .hero-entry-title {
          font-size: var(--large-font-size);
          font-family: var(--font-text-semibold);
          font-weight: 500;
        }
      }
      .hero-entry-text {
        .module-text {
        }
      }
    }
  }

  .hero-entry-container {
    position: relative;
    height: 100%;
    min-height: 35.3125rem;
  }

  .hero-entry-media {
    overflow: hidden;
    z-index: 500;
  }

  .hero-entry-content {
    position: absolute;
    left: 0;
    margin: 0;
    z-index: 999;
    background-color: var(--color-bg);
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    align-items: center;
    gap: var(--mid-margin);
    padding: var(--mid-padding);
    border-radius: 1.25rem;
    border: 0.0625rem solid var(--color-text);
    shape-rendering: crispEdges;
    width: clamp(300px, max-content, 397px);
    min-width: 300px;
    transform: translate(0, 50%);
    z-index: 999;
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

      .hero-entry-title,
      .hero-entry-show-artist-artist {
        font-size: var(--base-font-size);
        font-family: var(--font-text-semibold);
        font-weight: 500;
        text-transform: uppercase;
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
            background-color: var(--color-grey);
          }

          svg {
            width: 9px;
            height: 12px;
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
      gap: 0 var(--small-padding);
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
          background-color: var(--color-grey);
        }
      }
    }
  }
}
</style>