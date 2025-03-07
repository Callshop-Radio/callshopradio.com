<script setup lang="ts">
import emblaCarouselVue from "embla-carousel-vue";
import { useThrottleFn } from "@vueuse/core";
import { ref, onMounted, computed } from "vue";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();

// Props vereinfacht - Module direkt aus Sanity
const props = defineProps({
  module: {
    type: Object,
    required: true,
  },
});

// Embla Carousel direkt initialisieren
const [emblaNode, emblaApi] = emblaCarouselVue({
  align: "start",
  loop: true,
  slidesToScroll: 1, // Immer nur einen Slide (mit 3 Items) scrollen
});

// Für die Dots-Navigation
const selectedIndex = ref(0);
const scrollSnaps = ref<number[]>([]);

// Position speichern für flüssige Übergänge
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

// Dots-Funktionen
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

  // Scroll-Punkte für die Navigation erfassen
  scrollSnaps.value = emblaApi.value.scrollSnapList();

  // Aktuellen Index setzen
  selectedIndex.value = emblaApi.value.selectedScrollSnap();

  // Event-Listener für Auswahlaktualisierung
  emblaApi.value.on("select", onSelect);
};

// Event-Listener nach dem Mounting
onMounted(() => {
  if (emblaApi.value) {
    emblaApi.value.on("scroll", saveTranslatePositions);
    emblaApi.value.on("destroy", restoreTranslatePositions);

    // Setup für die Dots
    setupDots();
  }
});
// Hilfsfunktion zum Abrufen des richtigen Bildes
function getItemImage(item) {
  return (
    item.image || item.mainImage || mainStore.siteFallbacks.fallbackPerson.image
  );
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
watch(contentType, (newValue) => {
  if (["persons", "venues", "all"].includes(newValue)) {
    categoryType.value = "Pool";
  } else if (["sets", "shows"].includes(newValue)) {
    categoryType.value = "Shows";
  } else if (newValue === "words") {
    categoryType.value = "Words";
  } else {
    categoryType.value = "";
  }
}, { immediate: true });

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
      return groupItems(props.module.wordItems || []);
    default:
      return [];
  }
});
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
                v-if="getItemImage(item)"
                :image="getItemImage(item)"
                :class="`media-${module.style}`"
              />
              <!-- <MediaImage v-else /> -->
              <div class="slide-content">
                <h3 class="slide-title">{{ item.title }}</h3>
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
  @apply mb-4;
  max-width: var(--page-max-width);
  margin: var(--mid-margin) 0;

  &__title {
    @apply text-2xl font-bold mb-4;
  }

  .embla {
    @apply overflow-hidden;

    &__nav {
      @apply flex row items-center justify-space-between;
      margin: var(--mid-margin) 0;

      .embla__nav__arrows {
        @apply flex;
        gap: 0 var(--mid-padding);

        .embla__arrow {
          @apply flex items-center justify-center rounded-full transition-colors;
          background-color: transparent;

          svg {
            @apply w-5 h-5;
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
          @apply rounded-full bg-gray-300 transition-colors;
          width: 7px;
          height: 7px;

          &.is-selected {
            @apply bg-black;
          }

          &:hover {
            @apply bg-gray-400;
          }
        }
      }
    }

    &__container {
      @apply flex backface-hidden ml-[calc(var(--carousel-spacing)*-1)] touch-pan-y;
    }

    &__slide {
      @apply flex flex-grow-0 flex-shrink-0 flex-basis-auto min-w-0 pl-[var(--carousel-spacing)] relative;
      width: 100%; /* Jeder Slide nimmt volle Breite ein */
      :deep(img),
      :deep(.video-wrapper) {
        aspect-ratio: 3 / 4;
        object-fit: cover;
        @apply max-w-full w-100;
      }

      .slide-item {
        display: flex;
        flex-flow: column wrap;
        justify-content: flex-start;
        align-items: flex-start;
        .slide-content {
          display: flex;
          flex-flow: column wrap;
          justify-content: flex-start;
          align-items: flex-start;
          margin: var(--small-margin) 0 0 0;
          gap: var(--small-margin);
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
    .slide-item {
      &:first-child {
        padding: 0 var(--big-margin) 0 0;
      }
      &:last-child {
        padding: 0 0 0 var(--big-margin);
      }
    }
  }

  .slide-item {
    @apply flex-1 min-w-0;

    :deep(img) {
      @apply object-cover;
    }
  }
}
</style>