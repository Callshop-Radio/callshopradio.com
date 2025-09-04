<script setup lang="ts">
// Interfaces für Type Safety
interface SiteFallbacks {
  fallbackArticle?: {
    image?: { asset?: { url?: string } };
    description?: any[];
  };
  fallbackPerson?: {
    image?: { asset?: { url?: string } };
    description?: any[];
  };
  fallbackSet?: {
    image?: { asset?: { url?: string } };
    description?: any[];
  };
  fallbackShow?: {
    image?: { asset?: { url?: string } };
    description?: any[];
  };
  fallbackVenue?: {
    image?: { asset?: { url?: string } };
    description?: any[];
  };
}

interface ContentItem {
  _id: string;
  _type: string;
  slug?: { current?: string };
  title?: any;
  name?: any;
  image?: { asset?: { url?: string } };
  textTeaser?: any;
  text?: any;
  description?: any;
  tags?: any[];
  datetime?: string;
  poolVisibility?: string;
  soundcloud?: {
    tracks?: Array<{
      id?: string;
      permalink_url?: string;
      artwork_url?: string;
    }>;
  };
  parentShow?: {
    slug?: { current?: string };
    image?: { asset?: { url?: string } };
    tags?: any[];
  };
}

interface MainStore {
  siteFallbacks?: SiteFallbacks;
}

// Vue Composables
import { ref, computed, watch, onMounted, nextTick } from "vue";

// Nuxt Composables
import { useMainStore } from "~/stores/mainStore";
const { locale } = useI18n();
const localePath = useLocalePath();

// Store mit Type Assertion
const mainStore = useMainStore() as any; // Temporary any fix

const props = defineProps({
  module: {
    type: Object,
    required: true,
  },
});

// State für sichtbare Items
const itemsPerPage = 3;
const visibleItemCount = ref(itemsPerPage);

// Sortierungs-Zustand
const sortMode = ref("new"); // Standardmäßig "new" (chronologisch)
const shuffleSeed = ref(Date.now()); // Zufallsseed für Shuffle

// Funktion zum Ändern des Sortiermodus
function changeSortMode(mode: string) {
  if (mode === "shuffle") {
    // Bei jedem Klick auf Shuffle einen neuen Seed generieren
    shuffleSeed.value = Date.now();
  }
  sortMode.value = mode;
  // Nach Sortierung Items zurücksetzen
  visibleItemCount.value = itemsPerPage;
}

// Hilfsfunktion zur Formatierung von Datum/Zeit
function formatDate(dateString: string) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Artwork-URLs für SoundCloud-Tracks
const artworkUrls = ref(new Map());

// Funktion zum Laden weiterer Items
function loadMoreItems() {
  visibleItemCount.value += itemsPerPage;

  // Nach dem Laden neuer Items müssen wir die Artwork-URLs für die neuen Items laden
  nextTick(() => {
    if (props.module.type === "sets") {
      // Lade alle neu hinzugekommenen Items
      const newItems = allItems.value.slice(
        visibleItemCount.value - itemsPerPage,
        visibleItemCount.value
      );
      newItems.forEach((item: any) => {
        if (!artworkUrls.value.has(item?._id)) {
          loadArtworkUrl(item);
        }
      });
    }
  });
}

// Bestimmen, ob mehr Items zum Laden verfügbar sind
const hasMoreItems = computed(() => {
  return sortedItems.value && sortedItems.value.length > visibleItemCount.value;
});

// Alle verfügbaren Items basierend auf Modultyp
const allItems = computed(() => {
  if (!props.module) return [];

  switch (props.module.type) {
    case "pool":
      let poolItems = props.module.poolItems || [];
      if (props.module.poolContentType) {
        if (props.module.poolContentType === "persons") {
          poolItems = poolItems.filter((item: any) => item._type === "person");
        } else if (props.module.poolContentType === "venues") {
          poolItems = poolItems.filter((item: any) => item._type === "venue");
        } else if (props.module.poolContentType === "all") {
          poolItems = poolItems.filter(
            (item: any) => item._type === "venue" || item._type === "person"
          );
        }
      }
      return poolItems;
    case "sets":
      return props.module.setItems || [];
    case "shows":
      return props.module.showItems || [];
    case "words":
      return props.module.articleItems || [];
    default:
      return [];
  }
});

// Sortierte Items basierend auf allItems und sortMode
const sortedItems = computed(() => {
  if (!allItems.value || allItems.value.length === 0) return [];

  let sortedArray = [...allItems.value];

  // Sortierung anwenden
  if (sortMode.value === "new") {
    // Chronologisch sortieren (neuste zuerst)
    return sortedArray.sort((a, b) => {
      const dateA = new Date(a.datetime || a._updatedAt || a._createdAt || 0);
      const dateB = new Date(b.datetime || b._updatedAt || b._createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  } else if (sortMode.value === "shuffle") {
    // Shuffle mit stabilem Seed für die aktuelle Sitzung
    return shuffleArray([...sortedArray], shuffleSeed.value);
  } else if (sortMode.value === "alpha") {
    // Alphabetisch nach Titel sortieren
    return sortedArray.sort((a, b) => {
      // Bestimme den Titel je nach Content-Typ
      const titleA = (
        a.title ||
        a.name ||
        (a.parentShow ? a.parentShow?.title : "")
      ).toLowerCase();
      const titleB = (
        b.title ||
        b.name ||
        (b.parentShow ? b.parentShow?.title : "")
      ).toLowerCase();
      return titleA.localeCompare(titleB);
    });
  }

  return sortedArray;
});

// Sichtbare Items basierend auf sortierten Items und visibleItemCount
const visibleItems = computed(() => {
  return sortedItems.value.slice(0, visibleItemCount.value);
});

// Content-Typ des aktuellen Moduls
const contentType = computed(() => {
  if (!props.module) return null;

  // Basis-Typ ist der Modultyp
  let type = props.module.type || null;

  // Bei "pool" verwenden wir den spezifischen Pool-Content-Typ
  if (type === "pool" && props.module.poolContentType) {
    return props.module.poolContentType; // "persons", "venues" oder "all"
  }

  return type; // "sets", "shows", "words" oder null
});

// Kategorie-Typ für das UI
const categoryType = ref("");

// Watcher für den Content-Typ
watch(
  contentType,
  (newValue) => {
    if (["persons", "venues", "all"].includes(newValue)) {
      categoryType.value = "Pool";
    } else if (newValue === "sets") {
      categoryType.value = "Episodes";
    } else if (newValue === "shows") {
      categoryType.value = "Shows";
    } else if (newValue === "words") {
      categoryType.value = "Words";
    } else {
      categoryType.value = "";
    }
  },
  { immediate: true }
);

// Type Class Map für CSS-Klassen
const typeClassMap: Record<string, string> = {
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

// CSS-Klasse entsprechend dem Typ
const typeClass = computed(() => {
  return typeClassMap[props.module.type] || "default";
});
// helper function for image fetching and fallbacks
function getItemImage(item: any) {
  // Fallbacks je nach Content-Typ
  const itemType = item._type || "";

  // Bild aus dem Item selbst
  if (item.image) {
    return item.image;
  }
  if (item.mainImage) {
    return item.mainImage;
  }

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

function getItemRoute(item: any) {
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
      console.log(`No parent show found for item ${item?.slug?.current}`);
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

// Funktion zum Abrufen und Speichern der Artwork-URL
async function loadArtworkUrl(item: any) {
  if (!item) return;
  const url = await getSoundcloudArtwork(item);
  artworkUrls.value.set(item._id, url);
}

function checkImage(url: string) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function getSoundcloudArtwork(item: any) {
  // Definiere die Fallback-URLs explizit
  const parentShowImageUrl = item?.parentShow?.image?.asset?.url;
  const storeFallbackUrl = (mainStore?.siteFallbacks as any)?.fallbackSet?.image
    ?.asset?.url;
  const artworkUrl = item?.soundcloud?.tracks?.[0]?.artwork_url;

  // Versuche zunächst das SoundCloud-Artwork
  if (artworkUrl) {
    const originalUrl = artworkUrl.replace("-large", "-original");
    const exists = await checkImage(originalUrl);

    if (exists) {
      return originalUrl;
    }
  }
  // SoundCloud-Artwork existiert nicht, verwende Fallbacks

  // Prüfe parentShow Bild als ersten Fallback
  if (parentShowImageUrl) {
    return parentShowImageUrl;
  }

  // Prüfe Store-Fallback als zweiten Fallback
  if (storeFallbackUrl) {
    return storeFallbackUrl;
  }

  return "";
}

function playTrack(item: any) {
  if (item?.soundcloud?.tracks?.[0]) {
    const track = item.soundcloud.tracks[0];

    // Sicherstellen, dass permalink_url gesetzt ist
    if (!track.permalink_url && track.id) {
      // Wenn keine permalink_url, aber eine ID vorhanden ist, erstellen wir eine
      track.permalink_url = `https://api.soundcloud.com/tracks/${track.id}`;
    }

    // Track im Store speichern
    mainStore.currentTrack = track;
  } else {
    console.log("No soundcloud track found for item", item);
  }
}

// Stadt-Tags abrufen
function getItemCityTags(item: any) {
  const cityTags: any[] = [];

  // Direkte City-Tags
  if (item?.tags && Array.isArray(item?.tags)) {
    item?.tags.forEach((tag: any) => {
      if (tag._type === "tag.city") {
        cityTags.push(tag);
      }
    });
  }

  // City-Tags aus parentShow
  if (item?.parentShow?.tags && Array.isArray(item?.parentShow?.tags)) {
    item?.parentShow?.tags.forEach((tag: any) => {
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
function getItemNonCityTags(item: any) {
  if (!item?.tags || !Array.isArray(item?.tags)) return [];
  return item?.tags.filter((tag: any) => tag._type !== "tag.city");
}

// Helper für RichText Blocks
function getRichTextBlocks(content: any): unknown[] {
  if (!content) return [];
  // Verwende eine temporäre Lösung bis parseI18nObj verfügbar ist
  return Array.isArray(content) ? content : [];
}

function getRichTextBlocksSliced(content: any, slice = 1): unknown[] {
  if (!content) return [];
  // Verwende eine temporäre Lösung bis parseI18nObj verfügbar ist
  return Array.isArray(content) ? content.slice(0, slice) : [];
}

// Fisher-Yates Shuffle-Algorithmus mit Seed
function shuffleArray(array: any[], seed: number) {
  const rng = seededRandom(seed);
  let currentIndex = array.length;

  // Solange noch Elemente vorhanden sind
  while (currentIndex > 0) {
    // Ein verbleibendes Element auswählen
    const randomIndex = Math.floor(rng() * currentIndex);
    currentIndex--;

    // Mit dem aktuellen Element tauschen
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

// Einfacher seeded Random-Generator
function seededRandom(seed: number) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Watcher für visibleItems, um Artwork-URLs für neue Items zu laden
watch(
  visibleItems,
  (newItems) => {
    if (props.module.type === "sets") {
      newItems.forEach((item: any) => {
        if (!artworkUrls.value.has(item?._id)) {
          loadArtworkUrl(item);
        }
      });
    }
  },
  { deep: true }
);

// Lifecycle Hooks
onMounted(() => {
  // Beim ersten Laden die Artworks für alle sichtbaren Items laden
  if (props.module.type === "sets") {
    visibleItems.value.forEach((item: any) => {
      loadArtworkUrl(item);
    });
  }

  // Vorgängig auch alle Items laden, um die Bilder vorzubereiten
  if (
    props.module.type === "sets" &&
    allItems.value &&
    Array.isArray(allItems.value)
  ) {
    allItems.value.forEach((item: any) => {
      loadArtworkUrl(item);
    });
  }
});
</script>

<template>
  <div
    v-if="allItems && allItems.length > 0"
    :class="`content-teaser module-teaser module-teaser--${
      props.module.style || 'default'
    } ${typeClass}`"
  >
    <div class="module-teaser__header">
      <h3 v-if="props.module?.title" class="content-teaser__title">
        {{ props.module?.title }}
      </h3>
            <section class="module-teaser__header__type">
        <div class="content-teaser__sort">
          <div class="sort-options">
            <button
              :class="['sort-button', { active: sortMode === 'new' }]"
              @click="changeSortMode('new')"
            >
              <div class="dot"></div>
              New
            </button>
            <button
              :class="['sort-button', { active: sortMode === 'alpha' }]"
              @click="changeSortMode('alpha')"
            >
              <div class="dot"></div>
              A–Z
            </button>
            <button
              :class="['sort-button', { active: sortMode === 'shuffle' }]"
              @click="changeSortMode('shuffle')"
            >
              <div class="dot"></div>
              Shuffle
            </button>
          </div>
        </div>
        <NuxtLink 
          :to="categoryType === 'Episodes' ? localePath('/shows') : localePath(categoryType.toLowerCase())"
        >
          <h2 class="module-teaser__header__type__pill">
            {{ categoryType === 'Episodes' ? 'Shows' : categoryType }}
          </h2>
        </NuxtLink>
      </section>
    </div>

    <div class="content-teaser__grid">
      <!-- Grid-Items -->
      <div
        v-for="item in visibleItems"
        :key="item?._id"
        :class="`teaser-item teaser-item--${
          props.module.style || 'default'
        } ${typeClass}`"
      >
        <!-- Stadt-Tags falls vorhanden -->
        <div
          v-if="
            props.module.showTags &&
            getItemCityTags(item).length > 0 &&
            props.module.style !== 'image'
          "
          class="teaser-item__tags city-tags"
        >
          <span
            v-for="tag in getItemCityTags(item)"
            :key="tag._id"
            class="tag city"
          >
            {{
              tag?.short?.[1]?.value
                ? parseI18nObj(tag?.short)
                : tag?.short?.[0]?.value ?? tag.short
            }}
          </span>
        </div>

        <!-- Bild -->
        <NuxtLink
          v-if="item?.slug"
          :to="getItemRoute(item)"
          class="teaser-item__link"
        >
          <div class="teaser-item__image" v-if="props.module.type === 'sets'">
            <img
              v-if="item?.image && item?.image.asset && item?.image.asset.url"
              :src="item?.image.asset.url"
              :alt="item?.title || ''"
            />
            <div v-else-if="item?.soundcloud" class="track-artwork">
              <img
                v-if="artworkUrls.get(item?._id)"
                :src="artworkUrls.get(item?._id)"
                alt="Track Artwork"
                class="track-image"
              />
              <div v-else class="track-artwork-placeholder"></div>
            </div>
            <!-- Zusätzlicher Fallback für Sets ohne Artwork -->
            <div v-else class="image-placeholder">
              <img
                v-if="mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url"
                :src="mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url"
                alt="Fallback Image"
                class="fallback-image"
              />
            </div>
          </div>
          <div class="teaser-item__image" v-else>
            <MediaImage
              v-if="
                getItemImage(item) &&
                getItemImage(item).asset &&
                getItemImage(item).asset.url
              "
              :image="getItemImage(item)"
              :class="`media-${props.module.style || 'default'}`"
            />
            <div v-else class="image-placeholder">
              <img
                v-if="mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url"
                :src="mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url"
                alt="Fallback Image"
                class="fallback-image"
              />
            </div>
          </div>
        </NuxtLink>

        <!-- Inhalt -->
        <div class="teaser-item__content">
          <!-- Interaktiver Bereich mit Datum und Play-Button -->
          <section
            class="teaser-item__content__interactive"
            v-if="props.module.type !== 'pool'"
          >
            <!-- Datum (falls vorhanden) -->
            <div
              v-if="
                item?.datetime ||
                item?.publishedAt ||
                item?._updatedAt ||
                item?._createdAt
              "
              class="teaser-item__date"
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

            <!-- Play-Button für Sets -->
            <button
              v-if="props.module.type === 'sets' && item?.soundcloud"
              @click.prevent="playTrack(item)"
              class="play-button"
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

          <!-- Show-Informationen für Sets -->
          <div
            v-if="item?.parentShow && props.module.type === 'sets'"
            class="teaser-item__content__show"
          >
            <!-- Show-Titel -->
            <NuxtLink
              v-if="
                item?.parentShow?.title !== 'No Show' &&
                item?.parentShow?.slug &&
                item?.clickableTitle
              "
              :to="localePath(`/shows/${item?.parentShow?.slug.current}`)"
              class="teaser-item__link"
            >
              <h3 class="teaser-item__title show-title">
                {{ item?.parentShow?.title }}
              </h3>
            </NuxtLink>
            <h3 v-else class="teaser-item__title show-title">
              {{ item?.title || item?.parentShow?.title }}
            </h3>

            <!-- Künstler (für Sets) -->
            <div
              v-if="item?.persons && item?.persons.length > 0"
              class="show-artists"
            >
              <h3
                v-for="(artist, index) in item?.persons"
                :key="artist._id"
                class="teaser-item__artist"
              >
                <NuxtLink
                  v-if="artist?.poolVisibility"
                  :to="localePath(`/pool/${artist?.slug?.current}`)"
                  class="teaser-item__link"
                >
                  {{ artist?.title
                  }}{{ index < item?.persons?.length - 1 ? "," : "" }}&nbsp;
                </NuxtLink>
                <span v-else>
                  {{ artist.title
                  }}{{ index < item?.persons?.length - 1 ? "," : "" }}&nbsp;
                </span>
              </h3>
            </div>
          </div>

          <!-- Titel für alle anderen Content-Typen -->
          <NuxtLink
            v-if="props.module.type !== 'sets'"
            :to="getItemRoute(item)"
            class="teaser-item__link"
          >
            <h3 class="teaser-item__title">
              {{ item?.title || item?.name }}
            </h3>
          </NuxtLink>

          <!-- RichText Content -->
          <RichText
            v-if="item?.useTeaserText && item?.textTeaser"
            :blocks="getRichTextBlocks(item?.textTeaser)"
          />
          <RichText
            v-else-if="
              !item?.useTeaserText && item?.text && item?.text.length > 0
            "
            :blocks="getRichTextBlocksSliced(item?.text, 1)"
          />
          <RichText
            v-else-if="
              !item?.text &&
              item?.description &&
              item?.description.length > 0 &&
              (item?.description[0]?.value || item?.description[1]?.value)
            "
            :blocks="
              limitTextBlocks(parseI18nObj(item?.description)?.slice(0, 1), 100)
            "
          />
          <RichText
            v-else-if="
              !item?.text &&
              props.module.poolContentType == 'persons' &&
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
          />
          <RichText
            v-else-if="
              !item?.text &&
              props.module.poolContentType == 'venues' &&
              mainStore?.siteFallbacks?.fallbackVenue?.description.length > 0 &&
              (mainStore?.siteFallbacks?.fallbackVenue?.description?.[0]
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
          />

          <!-- Nicht-City Tags anzeigen -->
          <div
            v-if="props.module.showTags && getItemNonCityTags(item).length > 0"
            class="teaser-item__tags tags"
          >
            <span
              v-for="tag in getItemNonCityTags(item)"
              :key="tag._id"
              class="tag"
            >
              {{
                tag?.title?.[1]?.value
                  ? parseI18nObj(tag?.title)
                  : tag?.title?.[0]?.value ?? tag.title
              }}
            </span>
          </div>

          <!-- Genres anzeigen -->
          <div
            v-if="props.module.showTags && item.genres?.length"
            class="teaser-genres"
          >
            <span v-for="genre in item.genres" :key="genre._id" class="genre">{{
              genre.name || genre.title
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Load More Button -->
    <div v-if="hasMoreItems" class="content-teaser__load-more">
      <button @click="loadMoreItems" class="load-more-button">
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
.content-teaser {
  width: 100%;
  max-width: var(--page-max-width);
  margin: var(--mid-margin) 0;

  &__title {
    font-size: var(--heading-font-size);
    margin: 0;
  }

  &__sort {
    display: flex;
    justify-content: flex-end;
    width: max-content;

    .sort-options {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--mid-margin);
      border-radius: 100px;

      &__title {
        display: flex;
        flex-flow: row wrap;
        align-items: center;
        justify-content: center;
        font-size: var(--small-font-size);
        font-family: var(--font-text-semibold);
        text-transform: uppercase;
        color: var(--color-bg);
        pointer-events: none;
      }

      button {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
        align-items: center;
        gap: var(--small-padding);
        background-color: transparent;
        border: none;
        font-size: var(--small-font-size);
        color: var(--color-dark-grey);
        text-transform: uppercase;
        font-family: var(--font-text-semibold);
        cursor: pointer;
        transition: color 0.2s ease;

        @media (prefers-color-scheme: dark) {
          color: var(--color-bg);
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--color-dark-grey);
          transition: background-color 0.2s ease;

          @media (prefers-color-scheme: dark) {
            background-color: var(--color-bg);
          }
        }

        &:hover {
          @media (min-width: 1024px) {
            color: var(--color-pink);
          }
        }

        &.active {
          color: var(--color-pink);

          .dot {
            background-color: var(--color-pink);
          }
        }
      }
    }
  }

  &.shows,
  &.sets,
  &.episodes {
    .sort-options {
      button {
        &:hover {
          @media (min-width: 1024px) {
            color: var(--color-pink);
          }
        }

        &.active {
          color: var(--color-pink);

          .dot {
            background-color: var(--color-pink);
          }
        }
      }
    }
  }

  &.words {
    .sort-options {
      button {
        &:hover {
          @media (min-width: 1024px) {
            color: var(--color-green);
          }
        }

        &.active {
          color: var(--color-green);

          .dot {
            background-color: var(--color-green);
          }
        }
      }
    }
  }

  &.pool {
    .sort-options {
      button {
        &:hover {
          @media (min-width: 1024px) {
            color: var(--color-blue);
          }
        }

        &.active {
          color: var(--color-blue);

          .dot {
            background-color: var(--color-blue);
          }
        }
      }
    }
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
      border: 0.09325rem solid var(--color-text);
      box-shadow: 0 0 0.5rem 0.09325rem var(--color-text);

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

  .teaser-item__content__show {
    min-height: calc(
      var(--base-font-size) * 1.15 + var(--base-font-size) + var(--mid-padding)
    );
  }

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

    /* Stellen Sie sicher, dass nach jedem dritten Item ein Zeilenumbruch erfolgt */
    &:nth-child(3n) {
      margin-right: 0;
    }

    &:nth-child(3n + 1):nth-last-child(-n + 3),
    &:nth-child(3n + 1):nth-last-child(-n + 3) ~ .teaser-item {
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
        object-fit: cover;
        transition: transform 0.3s ease;
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

      &__interactive {
        width: 100%;
        display: flex;
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

      .teaser-item__title {
        font-size: var(--base-font-size);
        text-transform: uppercase;
        font-family: var(--font-text-semibold);
        margin: 0;
      }

      .teaser-item__artist {
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

      .teaser-item__tags {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
        align-items: flex-start;
        align-content: flex-start;
        gap: var(--small-margin);
        flex-grow: 1;
      }

      .teaser-genres {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
        align-items: flex-start;
        gap: var(--small-margin);

        .genre {
          background-color: var(--color-grey);
          color: var(--color-text);
          padding: var(--small-padding) var(--mid-padding);
          border-radius: 100px;
          font-size: var(--small-font-size);
          text-transform: uppercase;
        }
      }
    }

    &__tags {
      &.city-tags {
        position: absolute;
        top: var(--small-margin);
        left: var(--small-margin);
        z-index: 2;

        .tag.city {
          background-color: var(--color-text);
          color: var(--color-bg);
          padding: var(--small-padding) var(--mid-padding);
          border-radius: 100px;
          font-size: var(--small-font-size);
          text-transform: uppercase;
        }
      }
    }
  }

  /* Style-Anpassungen basierend auf module.style */
  &--cards {
    .teaser-item {
      &__image {
        img {
          aspect-ratio: 3 / 4 !important;
        }
      }
    }
  }

  &--thumbnails {
    .teaser-item {
      &__image {
        img {
          aspect-ratio: 1 / 1 !important;
        }
      }
    }
  }

  &--image {
    .teaser-item {
      display: flex;
      flex-direction: row;
      align-items: center;

      &__image {
        width: 62.75%;

        img {
          aspect-ratio: 3 / 1.5 !important;
        }
      }

      &__content {
        width: calc(100% - 62.75%);
        padding: 0 0 0 var(--big-margin);
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
    .teaser-item {
      &__image {
        img {
          aspect-ratio: 1 / 1 !important;
        }
      }
    }
  }

  &.words {
    .tag {
      &.city {
        background-color: var(--color-green);
        color: var(--color-white);
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
    .teaser-item {
      &__image {
        img {
          aspect-ratio: 3/4 !important;
        }
      }
    }
  }
}

/* Responsive Anpassungen */
@media (max-width: 900px) {
  .content-teaser {
    &__grid {
      gap: calc(var(--big-margin) / 2) calc(var(--big-margin));
    }

    .teaser-item {
      max-width: calc(50% - calc(var(--big-margin) / 2));

      /* Anpassungen für 2er-Grid */
      &:nth-child(3n) {
        margin-right: calc(var(--big-margin) / 2);
      }

      &:nth-child(2n) {
        margin-right: 0;
      }

      &:nth-child(2n + 1):nth-last-child(-n + 2),
      &:nth-child(2n + 1):nth-last-child(-n + 2) ~ .teaser-item {
        margin-bottom: 0;
      }
    }

    /* Image-Style anpassen für mobile */
    &--image {
      .teaser-item {
        flex-direction: column;

        &__image {
          width: 100%;
        }

        &__content {
          width: 100%;
          padding: var(--mid-padding) 0 0 0;
        }
      }
    }
  }
}

@media (max-width: 600px) {
  .content-teaser {
    .teaser-item {
      max-width: 100%;

      &:nth-child(2n) {
        margin-right: calc(var(--big-margin) / 2);
      }

      &:nth-child(1n) {
        margin-right: 0;
      }
    }
  }
}
</style>