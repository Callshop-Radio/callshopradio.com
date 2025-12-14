<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { useMainStore } from "~/stores/mainStore";

const { locale, setLocale } = useI18n();
const localePath = useLocalePath();

// Template-Referenzen
const setContentRef = ref<HTMLElement | null>(null);
const setMainRef = ref<HTMLElement | null>(null);

// Reactive height tracking
const setMainHeight = ref(0);
const windowWidth = ref(0);

// Typdefinitionen
interface Image {
  asset?: {
    url?: string;
  };
}

interface Person {
  _key?: string;
  title?: string;
  poolVisibility?: boolean;
  slug?: {
    current?: string;
  };
}

interface Tag {
  _id?: string;
  _type?: string;
  title?: any;
  short?: any;
}

interface Set {
  _id?: string;
  _type?: string;
  title?: string;
  image?: Image;
  content?: any;
  mainImage?: Image;
  parentShow?: {
    title?: string;
    image?: Image;
    content?: any;
    slug?: {
      current?: string;
    };
    tags?: Tag[];
  };
  datetime?: string;
  _updatedAt?: string;
  persons?: Person[];
  tags?: Tag[];
  tracklistRich?: any;
  tracklist?: any[];
  soundcloud?: {
    tracks?: Array<{
      id?: string;
      artwork_url?: string;
      permalink_url?: string;
    }>;
  };
}

// Props
const props = defineProps<{
  set: Set;
}>();

// Store
const mainStore = useMainStore();

// Composable für Bild-Management
const useImageManagement = () => {
  // Helper-Funktion für Bild-Fetching und Fallbacks
  function getItemImage(item?: Set): Image | null {
    if (!item) return null;

    // Bild aus dem Item selbst
    if (item.image || item.mainImage) {
      return item.image || item.mainImage;
    }

    // Fallback für Sets
    return mainStore?.siteFallbacks?.fallbackSet?.image;
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

// Composable für SoundCloud-Funktionalität
const useSoundCloud = () => {
  const artworkUrl = ref("");
  const { checkImage } = useImageManagement();

  // Non-blocking - returns URL directly
  function getSoundcloudArtwork(item?: Set): string {
    if (!item) return "";
    // Try SoundCloud artwork first
    const artworkUrl = item?.soundcloud?.tracks?.[0]?.artwork_url;
    if (artworkUrl) {
      return artworkUrl.replace("-large", "-t500x500");
    }
    // Fallback chain
    const parentShowImageUrl = item?.parentShow?.image?.asset?.url;
    const storeFallbackUrl = mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url;
    return parentShowImageUrl || storeFallbackUrl || "";
  }

  function loadArtworkUrl() {
    if (!props.set) return;
    const url = getSoundcloudArtwork(props.set);
    artworkUrl.value = url;
  }

  function playTrack() {
    const item = props.set;
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

// Computed property für die Höhe von set-main
const computedSetMainHeight = computed(() => {
  // Unter 900px Bildschirmbreite soll die Höhe 100% sein
  if (windowWidth.value <= 900) {
    return "100%";
  }
  return setMainHeight.value;
});

// Funktion zum Aktualisieren der Höhe
const updateSetMainHeight = () => {
  if (setMainRef.value) {
    setMainHeight.value = setMainRef.value.offsetHeight;
  }
};

// Funktion zum Aktualisieren der Fensterbreite
const updateWindowWidth = () => {
  if (typeof window !== "undefined") {
    windowWidth.value = window.innerWidth;
  }
};

// Anwendung der Composables
const { getItemImage } = useImageManagement();
const { artworkUrl, loadArtworkUrl, playTrack } = useSoundCloud();

// Funktion zum Anpassen der Höhe
const adjustSetContentHeight = () => {
  if (setMainRef.value && setContentRef.value) {
    const setMainHeight = setMainRef.value.offsetHeight;
    setContentRef.value.style.height = `${setMainHeight}px`;
  }
};

// Stadt-Tags abrufen
function getItemCityTags(item: Set): Tag[] {
  const cityTags: Tag[] = [];

  // Direkte City-Tags
  if (item?.tags && Array.isArray(item?.tags)) {
    item?.tags.forEach((tag: Tag) => {
      if (tag._type === "tag.city") {
        cityTags.push(tag);
      }
    });
  }

  // City-Tags aus parentShow
  if (item?.parentShow?.tags && Array.isArray(item?.parentShow?.tags)) {
    item?.parentShow?.tags.forEach((tag: Tag) => {
      if (tag._type === "tag.city") {
        if (!cityTags.some((existingTag) => existingTag._id === tag._id)) {
          cityTags.push(tag);
        }
      }
    });
  }

  return cityTags;
}

// Nicht-Stadt-Tags abrufen
function getItemNonCityTags(item: Set): Tag[] {
  if (!item?.tags || !Array.isArray(item?.tags)) return [];
  return item?.tags.filter((tag: Tag) => tag._type !== "tag.city");
}

// Lebenszyklus-Hooks
onMounted(() => {
  loadArtworkUrl();
  nextTick();

  // Initiale Messungen
  updateSetMainHeight();
  updateWindowWidth();

  // ResizeObserver für responsive Änderungen
  if (typeof window !== "undefined" && setMainRef.value) {
    const resizeObserver = new ResizeObserver(() => {
      updateSetMainHeight();
    });
    resizeObserver.observe(setMainRef.value);

    // Window resize listener für Fenstergrößenänderungen
    const handleResize = () => {
      updateWindowWidth();
      updateSetMainHeight();
    };
    window.addEventListener("resize", handleResize);

    // MutationObserver für DOM-Änderungen
    const mutationObserver = new MutationObserver(() => {
      updateSetMainHeight();
    });
    mutationObserver.observe(setMainRef.value, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });
  }
});
</script>

<template>
  <div v-if="set" class="set-content" ref="setContentRef">
    <div class="set-main" ref="setMainRef">
      <!-- Bild/Media-Bereich -->
      <div class="set-media">
        <NuxtLink v-if="set" :to="getItemRoute(set)" class="grid-item__link">
          <img
            v-if="artworkUrl"
            :src="artworkUrl"
            alt="Audio Artwork"
            class="set-image track-artwork"
            loading="lazy"
          />
          <div
            v-else
            class="track-artwork-placeholder"
            @vue:mounted="loadArtworkUrl"
          ></div>
        </NuxtLink>
      </div>

      <!-- Content-Bereich -->
      <div class="set-info">
        <!-- Play-Button für Audio-Inhalte -->
        <button
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

        <div class="set-info-container">
          <!-- Titel-Bereich -->
          <div class="set-header">
            <!-- Datum -->
            <div class="set-meta">
              <h3 class="set-date" v-if="set?.datetime">
                {{ formatDate(set.datetime) }}
              </h3>
              <h3 class="set-date" v-else-if="set?._updatedAt">
                {{ formatDate(set._updatedAt) }}
              </h3>
              <h3 class="set-date" v-else-if="set?.title">
                {{ set.title }}
              </h3>
            </div>
            <div class="set-show-title">
              <NuxtLink
                v-if="set?.parentShow?.title !== 'No Show' && set?.parentShow"
                :to="localePath(`/shows/${set?.parentShow?.slug?.current}`)"
                class="set__link set-title"
              >
                <h2 v-if="set?.parentShow?.title" class="set-title">
                  {{ set?.parentShow?.title }}
                </h2>
              </NuxtLink>
              <div>
                <h3
                  v-for="(artist, index) in set.persons"
                  :key="artist._key"
                  class="set__artist"
                >
                  <NuxtLink
                    v-if="artist?.poolVisibility"
                    :to="localePath(`/pool/${artist?.slug.current}`)"
                    class="set__artist"
                  >
                    {{ artist.title
                    }}{{ index < set.persons.length - 1 ? "," : "" }}&nbsp;
                  </NuxtLink>
                  <span class="set__artist" v-else>
                    {{ artist.title
                    }}{{ index < set.persons.length - 1 ? "," : "" }}&nbsp;
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
                tag?.title?.[1]?.value
                  ? parseI18nObj(tag?.title)
                  : tag?.title[0]?.value ?? tag.title
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      class="set-details"
      :style="` max-height: ${computedSetMainHeight}px; height: ${computedSetMainHeight}px`"
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
        <RichText :blocks="mainStore?.siteFallbacks?.fallbackSet?.description" />
      </section>
      <section class="tracklist" v-if="set?.tracklistRich">
        <h3>Tracklist</h3>
        <RichText class="tracklist-rich" :blocks="set?.tracklistRich" />
      </section>
      <section class="tracklist" v-else-if="set?.tracklist">
        <h3>Tracklist</h3>
        <div class="rich-text">
          <p v-for="track in set?.tracklist" :key="track._key">{{ track }}</p>
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