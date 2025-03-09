<script setup lang="ts">
import emblaCarouselVue from "embla-carousel-vue";
import { useThrottleFn } from "@vueuse/core";
import { ref, onMounted, computed } from "vue";
import { useMainStore } from "~/stores/mainStore";
import { limitTextBlocks } from "~/composables/useLimitTextBlocks";

const mainStore = useMainStore();

const props = defineProps({
  module: {
    type: Object,
    required: true,
  },
});

// Init Embla Carousel
const [emblaNode, emblaApi] = emblaCarouselVue({
  align: "start",
  loop: true,
  slidesToScroll: 1, // One slide with 3 items
});

// Dots nav
const selectedIndex = ref(0);
const scrollSnaps = ref<number[]>([]);

// Save position for smooth transitions
const saveTranslatePositions = useThrottleFn(() => {
  if (!emblaContainer.value) return;
  containerStyle = emblaContainer.value.style.transform;
}, 100);

const emblaContainer = ref<HTMLElement>();
let containerStyle: string = "";

async function restoreTranslatePositions() {
  if (!emblaContainer.value) return;
  emblaContainer.value.style.transform = containerStyle;
}

// Dots functions
const onSelect = () => {
  if (!emblaApi.value) return;
  selectedIndex.value = emblaApi.value.selectedScrollSnap();
};

const scrollTo = (index: number) => {
  if (!emblaApi.value) return;
  emblaApi.value.scrollTo(index);
};

const scrollPrev = () => {
  if (!emblaApi.value) return;
  emblaApi.value.scrollPrev();
};

const scrollNext = () => {
  if (!emblaApi.value) return;
  emblaApi.value.scrollNext();
};

const setupDots = () => {
  if (!emblaApi.value) return;

  // Scroll snaps for navigation
  scrollSnaps.value = emblaApi.value.scrollSnapList();

  // Set current index
  selectedIndex.value = emblaApi.value.selectedScrollSnap();

  // Event-Listener for updating the selected index
  emblaApi.value.on("select", onSelect);
};

// Event-Listener after mounting
onMounted(() => {
  if (emblaApi.value) {
    emblaApi.value.on("scroll", saveTranslatePositions);
    emblaApi.value.on("destroy", restoreTranslatePositions);

    setupDots();
  }
});

// helper function for image fetching and fallbacks
function getItemImage(item) {
  // Fallbacks je nach Content-Typ
  const itemType = item._type || "";

  // Bild aus dem Item selbst
  if (item.image || item.mainImage) {
    return item.image || item.mainImage;
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

// Hilfsfunktion für SoundCloud-Artwork mit Fallback
function getSoundcloudArtwork(item) {
  // Prüfen auf SoundCloud-Daten und Artwork
  const artworkUrl = item?.soundcloud?.tracks?.[0]?.artwork_url;

  if (artworkUrl) {
    // Die URL von '-large' zu '-t200x200' Format ändern
    return artworkUrl.replace("-large", "-t500x500");
  }

  // Fallbacks, falls kein SoundCloud-Artwork vorhanden ist
  if (item._type === "set") {
    return mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url || "";
  }

  // Generisches Fallback
  return "";
}

// Hilfsfunktion zum Gruppieren der Items in Dreiergruppen
function groupItems(items, contentType = null) {
  if (!items || !items.length) return [];

  // Items nach contentType filtern, falls angegeben
  let filteredItems = items;

  if (contentType) {
    // Korrigierte Filterlogik basierend auf dem Schema
    if (contentType === "persons") {
      filteredItems = items.filter((item) => item._type === "person");
    } else if (contentType === "venues") {
      filteredItems = items.filter((item) => item._type === "venue");
    } else if (contentType === "all") {
      filteredItems = items.filter(
        (item) => item._type === "venue" || item._type === "person"
      );
    }
  }

  // Rest der Funktion bleibt unverändert
  // Anzahl begrenzen, falls count angegeben ist
  let limitedItems = filteredItems;
  if (
    props.module.count &&
    props.module.count > 0 &&
    props.module.style !== "image"
  ) {
    limitedItems = filteredItems.slice(0, props.module.count * 3);
  } else if (props.module.style == "image") {
    limitedItems = filteredItems.slice(0, props.module.count);
  }

  // In Dreiergruppen aufteilen
  const groups = [];
  if (props.module.style !== "image") {
    for (let i = 0; i < limitedItems.length; i += 3) {
      groups.push(limitedItems.slice(i, i + 3));
    }
  } else {
    for (let i = 0; i < limitedItems.length; i += 1) {
      groups.push(limitedItems.slice(i, i + 1));
    }
  }
  return groups;
}

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

// Berechne gruppierte Items nach Typ
const groupedItems = computed(() => {
  if (!props.module) return [];

  switch (props.module.type) {
    case "pool":
      return groupItems(
        props.module.poolItems || [],
        props.module.poolContentType
      );
    case "sets":
      return groupItems(props.module.setItems || []);
    case "shows":
      return groupItems(props.module.showItems || []);
    case "words":
      return groupItems(props.module.articleItems || []);
    default:
      return [];
  }
});

function playTrack(item) {
  console.log("playTrack aufgerufen mit item:", item);

  if (item?.soundcloud?.tracks?.[0]) {
    const track = item.soundcloud.tracks[0];

    // Sicherstellen, dass permalink_url gesetzt ist
    if (!track.permalink_url && track.id) {
      // Wenn keine permalink_url, aber eine ID vorhanden ist, erstellen wir eine
      console.log(
        "Keine permalink_url gefunden, erstelle eine basierend auf der ID"
      );
      track.permalink_url = `https://api.soundcloud.com/tracks/${track.id}`;
    }

    console.log("Setze Track im Store mit permalink_url:", track.permalink_url);

    // Track im Store speichern
    mainStore.currentTrack = track;

    // In der Konsole ausgeben
    console.log("SoundCloud Track gesetzt:", mainStore.currentTrack);
  } else {
    console.warn("Kein SoundCloud-Track für dieses Item verfügbar:", item);
  }
}
</script>

<template>
  <div
    v-if="module"
    :class="`embla module-carousel module-carousel--${
      module.style || 'default'
    } ${categoryType.toLowerCase()}`"
  >
    <div class="module-carousel__header">
      <h3 v-if="module.title" class="module-carousel__title">
        {{ module.title }}
      </h3>
      <section class="module-carousel__header__type">
        <h2 class="module-carousel__header__type__pill">{{ categoryType }}</h2>
      </section>
    </div>
    <nav class="embla__nav">
      <!-- Dot Navigation -->
      <div class="embla__nav__dots" v-if="scrollSnaps.length > 1">
        <button
          v-for="(_, index) in scrollSnaps"
          :key="index"
          :class="['embla__dot', { 'is-selected': index === selectedIndex }]"
          @click="scrollTo(index)"
        ></button>
      </div>

      <!-- Arrow Navigation -->
      <div class="embla__nav__arrows" v-if="scrollSnaps.length > 1">
        <button
          class="embla__arrow embla__arrow--prev"
          @click="scrollPrev"
          aria-label="Vorheriger Slide"
        >
          <svg
            width="22"
            height="20"
            viewBox="0 0 22 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1.67986e-07 9.84832L21.1305 0.452866L21.1305 19.2438L1.67986e-07 9.84832Z"
              fill="black"
            />
          </svg>
        </button>
        <button
          class="embla__arrow embla__arrow--next"
          @click="scrollNext"
          aria-label="Nächster Slide"
        >
          <svg
            width="22"
            height="20"
            viewBox="0 0 22 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22 9.84894L0.86951 19.2444L0.869511 0.453482L22 9.84894Z"
              fill="black"
            />
          </svg>
        </button>
      </div>
    </nav>

    <div ref="emblaNode" class="embla">
      <div ref="emblaContainer" class="embla__container">
        <div
          v-for="(group, groupIndex) in groupedItems"
          :key="groupIndex"
          class="embla__slide"
        >
          <div :class="`slide-group group-${module.style || 'default'}`">
            <div
              v-for="item in group"
              :key="item._id"
              :class="`slide-item slide-${module.style || 'default'}`"
            >
              <div
                v-if="
                  module.showTags &&
                  item.tags?.length &&
                  module.style !== 'image'
                "
                class="slide__tags city-tags"
              >
                <button
                  v-for="tag in item.tags.filter(
                    (tag) => tag._type == 'tag.city'
                  )"
                  :key="tag._id || tag._ref"
                  class="tag city"
                >
                  {{
                    tag?.short?.[1]?.value
                      ? parseI18nObj(tag?.short)
                      : tag?.short[0].value ?? tag.short
                  }}
                </button>
              </div>
              <div
                v-else-if="module.style !== 'image'"
                class="slide__tags city-tags"
              ></div>
              <MediaImage
                v-if="getItemImage(item) && categoryType !== 'Episodes'"
                :image="getItemImage(item)"
                :class="`media-${module.style}`"
              />
              <img
                v-else-if="categoryType === 'Episodes'"
                :src="getSoundcloudArtwork(item)"
                alt="Episode Image"
                class="track-artwork"
              />
              <div class="slide-content">
                <section class="slide-content__interactive">
                  <h3 class="slide-date" v-if="item?._updatedAt">
                    {{ formatDate(item._updatedAt) }}
                  </h3>
                  <button
                    @click="playTrack(item)"
                    v-if="categoryType == 'Episodes'"
                    class="play"
                  >
                    <svg
                      width="9"
                      height="12"
                      viewBox="0 0 9 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M9 6L-4.89399e-07 11.1962L-3.51373e-08 0.803847L9 6Z"
                        fill="black"
                      />
                    </svg>
                  </button>
                </section>
                <h3 class="slide-title">{{ item?.title }}</h3>
                <RichText
                  v-if="item?.useTeaserText && item?.textTeaser"
                  :blocks="parseI18nObj(item?.textTeaser)"
                />
                <RichText
                  v-else-if="
                    !item?.useTeaserText && item?.text && item.text.length > 0
                  "
                  :blocks="parseI18nObj(item.text).slice(0, 1)"
                />
                <RichText
                  v-else-if="
                    !item?.text &&
                    item?.description &&
                    item.description.length > 0 &&
                    (item.description[0]?.value || item.description[1]?.value)
                  "
                  :blocks="
                    limitTextBlocks(
                      parseI18nObj(item.description).slice(0, 1),
                      100
                    )
                  "
                />
                <div
                  v-if="module.showTags && item.tags?.length"
                  class="slide__tags tags"
                >
                  <button
                    v-for="tag in item.tags.filter(
                      (tag) => tag._type !== 'tag.city'
                    )"
                    :key="tag._id || tag._ref"
                    class="tag"
                  >
                    {{
                      tag?.title?.[1]?.value
                        ? parseI18nObj(tag?.title)
                        : tag?.title[0].value ?? tag.title
                    }}
                  </button>
                </div>
                <div
                  v-if="module.showTags && item.genres?.length"
                  class="slide-genres"
                >
                  <span
                    v-for="genre in item.genres"
                    :key="genre._id"
                    class="genre"
                    >{{ genre.name || genre.title }}</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.module-carousel {
  @apply overflow-hidden;
  max-width: clamp(100%, 100%, var(--page-max-width));
  /* margin: var(--mid-margin) 0; */

  &--cards {
    .slide-group {
      .slide-item {
        &:first-child {
          padding: 0 var(--big-margin) 0 0;
          border-right: 1px solid var(--color-text);
        }
        &:last-child {
          padding: 0 0 0 var(--big-margin);
          border-left: 1px solid var(--color-text);
        }
      }
    }
  }
  &--thumbnails {
    &.embla {
      .embla__slide {
        :deep(img),
        :deep(.video-wrapper) {
          aspect-ratio: 1 / 1 !important;
          object-fit: cover;
          @apply max-w-full w-100;
        }
        .slide-group {
          .slide-item {
            &:first-child {
              padding: 0 var(--big-margin) 0 0;
            }
            &:last-child {
              padding: 0 0 0 var(--big-margin);
            }
            .slide-content {
              &__interactive {
                width: 100%;
                display: flex;
                flex-flow: row wrap;
                justify-content: space-between;
                align-items: center;
                gap: var(--mid-padding);
                .play {
                  display: flex;
                  flex-flow: row;
                  justify-content: center;
                  align-items: center;
                  margin: 0 0 0 auto;
                  color: transparent;
                  background-color: transparent;
                  border-radius: 100px;
                  border: none;
                  padding: 4px;
                  width: calc(var(--base-font-size) + 4px);
                  height: calc(var(--base-font-size) + 4px);
                  background-color: var(--color-text);

                  svg {
                    height: var(--base-font-size);
                    transform: translate(1px,0);
                    rect,
                    path {
                      fill: var(--color-bg);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  &--image {
    &.embla {
      .embla__slide {
        :deep(img),
        :deep(.video-wrapper) {
          aspect-ratio: 3 / 1.5 !important;
          object-fit: cover;
          object-position: center;
          @apply max-w-full;
          width: 62.75%;
        }
        .slide-group {
          .slide-item {
            display: flex;
            flex-flow: row wrap;
            justify-content: flex-start;
            align-items: center;
            flex: auto;
            min-width: 0;
            .slide-content {
              width: calc(100% - 62.75%);
              padding: var(--big-margin) 0 var(--big-margin) var(--big-margin);
              .slide-title {
                font-size: var(--large-font-size);
                text-transform: uppercase;
              }
            }
          }
        }
      }
    }
  }

  &__title {
    @apply text-2xl font-bold mb-4;
  }

  /* styles for cards & thumbnails */
  .embla {
    @apply overflow-hidden;
    margin-left: calc(var(--big-margin) * -0.5);
    max-width: calc(var(--page-max-width) + var(--big-margin));
    width: calc(var(--page-max-width) + var(--big-margin));

    &__nav {
      @apply flex row items-center justify-space-between;
      margin: var(--mid-margin) 0;

      .embla__nav__arrows {
        @apply flex;
        gap: 0 var(--mid-margin);
        margin: 0 calc(var(--mid-margin) + var(--base-padding)) 0 0;

        .embla__arrow {
          @apply flex items-center justify-center rounded-full transition-colors;
          background-color: transparent;

          svg {
            @apply w-5 h-5;
            path {
              fill: var(--color-text);
            }
          }

          &:focus {
            @apply outline-none ring-2 ring-black ring-opacity-50;
          }
        }
      }

      .embla__nav__dots {
        @apply flex row items-center justify-start flex-grow-1;
        gap: 0 var(--small-padding);

        .embla__dot {
          @apply rounded-full transition-colors;
          width: 7px;
          height: 7px;
          background-color: var(--color-grey);

          &.is-selected {
            background-color: var(--color-text);
          }

          &:hover {
            @apply bg-gray-400;
          }
        }
      }
    }

    &__container {
      @apply flex backface-hidden touch-pan-y;
    }
    &__slide {
      @apply flex flex-grow-0 flex-shrink-0 flex-basis-auto min-w-0 relative;
      width: 100%; /* Jeder Slide nimmt volle Breite ein */
      padding: 0 calc(var(--big-margin) / 2);
      :deep(img),
      :deep(.video-wrapper) {
        aspect-ratio: 3 / 4 !important;
        object-fit: cover;
        @apply max-w-full w-100;
      }

      .slide-item {
        display: flex;
        flex-flow: column wrap;
        justify-content: flex-start;
        align-items: flex-start;
        .slide-content {
          width: 100%;
          display: flex;
          flex-flow: column wrap;
          justify-content: flex-start;
          align-items: flex-start;
          flex-grow: 1;
          margin: var(--mid-padding) 0 0 0;
          gap: var(--mid-padding);
          .slide-date {
            font-size: var(--small-font-size);
            text-transform: uppercase;
          }
          .slide-title {
            font-size: var(--base-font-size);
            text-transform: uppercase;
          }
        }
      }
    }
  }

  .slide-group {
    @apply flex w-full;
    justify-content: space-between;
    align-items: stretch;
    gap: 0 var(--big-margin);
  }

  .slide-item {
    @apply flex-1 min-w-0;

    :deep(img) {
      @apply object-cover;
    }
  }
}
</style>