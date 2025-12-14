<script setup lang="ts">
import emblaCarouselVue from "embla-carousel-vue";
import { useThrottleFn } from "@vueuse/core";
import { ref, onMounted, computed } from "vue";
import { useMainStore } from "~/stores/mainStore";
const { locale, setLocale } = useI18n();
const localePath = useLocalePath();

const mainStore = useMainStore();

const props = defineProps({
  module: {
    type: Object,
    required: true,
  },
});

const currentIndex = ref(0);

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

// Screen-Größe überwachen
const isDesktop = ref(true);

// Mobile Carousel Instanz
const [mobileEmblaNode, mobileEmblaApi] = emblaCarouselVue({
  align: "start",
  loop: true,
  slidesToScroll: 1,
});

const mobileContainer = ref<HTMLElement>();
let mobileContainerStyle: string = "";
const mobileCurrentIndex = ref(0);
const mobileSelectedIndex = ref(0);
const mobileScrollSnaps = ref<number[]>([]);

// Dots functions
const onSelect = () => {
  if (!emblaApi.value) return;
  selectedIndex.value = emblaApi.value.selectedScrollSnap();
  currentIndex.value = selectedIndex.value;
};
const scrollTo = (index: number) => {
  if (!emblaApi.value) return;
  emblaApi.value.scrollTo(index);
  currentIndex.value = index;
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
  currentIndex.value = selectedIndex.value; // Initialisiere currentIndex

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

  // Mobile Slider Setup
  if (mobileEmblaApi.value) {
    mobileEmblaApi.value.on("scroll", mobileSaveTranslatePositions);
    mobileEmblaApi.value.on("destroy", mobileRestoreTranslatePositions);
    mobileSetupDots();
  }

  // Bildschirmgröße überwachen
  checkScreenSize();
  window.addEventListener("resize", checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", checkScreenSize);
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

const artworkUrls = ref(new Map());

// Funktion zum Abrufen und Speichern der Artwork-URL (synchron)
function loadArtworkUrl(item) {
  if (!item) return;
  const url = getSoundcloudArtwork(item);
  artworkUrls.value.set(item._id, url);
}

function checkImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Non-blocking artwork URL resolution - returns URL directly
function getSoundcloudArtwork(item) {
  // Try SoundCloud artwork first (use -t500x500 for better quality)
  const artworkUrl = item?.soundcloud?.tracks?.[0]?.artwork_url;
  if (artworkUrl) {
    return artworkUrl.replace("-large", "-t500x500");
  }
  // Fallback chain
  const parentShowImageUrl = item?.parentShow?.image?.asset?.url;
  const storeFallbackUrl = mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url;
  return parentShowImageUrl || storeFallbackUrl || "";
}

// Hilfsfunktion zum Gruppieren der Items in Dreiergruppen mit Optimierung für vollständige Slides
function groupItems(items, contentType = null) {
  if (!items || !items.length) return [];

  // Items nach contentType filtern, falls angegeben
  let filteredItems = items;

  if (contentType) {
    // Filterlogik basierend auf dem Schema
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

  // Bei "image" Style: Ein Item pro Gruppe
  if (props.module.style === "image") {
    // Anzahl begrenzen, falls count angegeben ist
    const limitedItems =
      props.module.count && props.module.count > 0
        ? filteredItems.slice(0, props.module.count)
        : filteredItems;

    // Jedes Item in ein Array verpacken
    return limitedItems.map((item) => [item]);
  }

  // Bei anderen Styles: In Dreiergruppen aufteilen

  // Anzahl der Items auf eine durch 3 teilbare Zahl begrenzen
  let itemCount = filteredItems.length;

  // Wenn count angegeben ist, begrenzen wir auf die nächstkleinere durch 3 teilbare Zahl
  if (props.module.count && props.module.count > 0) {
    // Mehrere volle Slides mit je 3 Items (count * 3)
    const maxCount = props.module.count * 3;

    // Auf die nächstkleinere durch 3 teilbare Zahl begrenzen
    itemCount = Math.min(itemCount, maxCount);
  }

  // Auf die nächstkleinere durch 3 teilbare Zahl abrunden
  itemCount = Math.floor(itemCount / 3) * 3;

  // Items begrenzen
  const limitedItems = filteredItems.slice(0, itemCount);

  // In Dreiergruppen aufteilen
  const groups = [];
  for (let i = 0; i < limitedItems.length; i += 3) {
    groups.push(limitedItems.slice(i, i + 3));
  }

  return groups;
}

// Für mobile Version: Ein Element pro Slide
function groupMobileItems(items, contentType = null) {
  if (!items || !items.length) return [];

  // Items nach contentType filtern, analog zur Desktop-Version
  let filteredItems = items;

  if (contentType) {
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

  // Anzahl begrenzen, falls count angegeben ist
  let limitedItems = filteredItems;
  if (props.module.count && props.module.count > 0) {
    limitedItems = filteredItems.slice(0, props.module.count);
  }

  // Für mobile: Ein Item pro Gruppe
  return limitedItems.map((item) => [item]);
}

// Mobile Slider Dots-Funktionen
const mobileOnSelect = () => {
  if (!mobileEmblaApi.value) return;
  mobileSelectedIndex.value = mobileEmblaApi.value.selectedScrollSnap();
  mobileCurrentIndex.value = mobileSelectedIndex.value;
};

const mobileScrollTo = (index: number) => {
  if (!mobileEmblaApi.value) return;
  mobileEmblaApi.value.scrollTo(index);
  mobileCurrentIndex.value = index;
};

const mobileScrollPrev = () => {
  if (!mobileEmblaApi.value) return;
  mobileEmblaApi.value.scrollPrev();
};

const mobileScrollNext = () => {
  if (!mobileEmblaApi.value) return;
  mobileEmblaApi.value.scrollNext();
};

const mobileSetupDots = () => {
  if (!mobileEmblaApi.value) return;
  mobileScrollSnaps.value = mobileEmblaApi.value.scrollSnapList();
  mobileSelectedIndex.value = mobileEmblaApi.value.selectedScrollSnap();
  mobileCurrentIndex.value = mobileSelectedIndex.value;
  mobileEmblaApi.value.on("select", mobileOnSelect);
};

// Speichern/Wiederherstellen der Position für mobile
const mobileSaveTranslatePositions = useThrottleFn(() => {
  if (!mobileContainer.value) return;
  mobileContainerStyle = mobileContainer.value.style.transform;
}, 100);

async function mobileRestoreTranslatePositions() {
  if (!mobileContainer.value) return;
  mobileContainer.value.style.transform = mobileContainerStyle;
}

// Mobile Slider Items berechnen
const mobileGroupedItems = computed(() => {
  if (!props.module) return [];

  switch (props.module.type) {
    case "pool":
      return groupMobileItems(
        props.module.poolItems || [],
        props.module.poolContentType
      );
    case "sets":
      return groupMobileItems(props.module.setItems || []);
    case "shows":
      return groupMobileItems(props.module.showItems || []);
    case "words":
      return groupMobileItems(props.module.articleItems || []);
    default:
      return [];
  }
});

// Prüfen der Bildschirmgröße
function checkScreenSize() {
  isDesktop.value = window.innerWidth >= 900;
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

  // Hole die bereits sortierten Items aus dem Modul entsprechend dem Typ
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
      <h3 v-if="module?.title" class="module-carousel__title">
        {{ module?.title }}
      </h3>
      <section
        v-if="categoryType == 'Episodes'"
        class="module-carousel__header__type"
      >
        <NuxtLink :to="localePath('/shows')">
          <h2 class="module-carousel__header__type__pill">Shows</h2>
        </NuxtLink>
      </section>
      <section v-else class="module-carousel__header__type">
        <NuxtLink :to="localePath(categoryType.toLowerCase())">
          <h2 class="module-carousel__header__type__pill">
            {{ categoryType }}
          </h2>
        </NuxtLink>
      </section>
    </div>

    <!-- Desktop Version (v-show wenn >= 900px) -->
    <div v-show="isDesktop">
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
            :class="{ active: groupIndex === currentIndex }"
          >
            <div :class="`slide-group group-${module.style || 'default'}`">
              <!-- Existierender Slider-Inhalt für Desktop -->
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
                <NuxtLink
                  v-if="item?.slug"
                  :to="getItemRoute(item)"
                  class="slide__link"
                >
                  <MediaImage
                    v-if="getItemImage(item) && categoryType !== 'Episodes'"
                    :image="getItemImage(item)"
                    :class="`media-${module.style}`"
                  />
                  <img
                    v-else-if="
                      categoryType === 'Episodes' && artworkUrls.get(item._id)
                    "
                    :src="artworkUrls.get(item._id)"
                    alt="Episode Image"
                    class="track-artwork"
                  />
                  <div
                    v-else-if="categoryType === 'Episodes'"
                    class="track-artwork-placeholder"
                    @vue:mounted="loadArtworkUrl(item)"
                  ></div>
                </NuxtLink>
                <div class="slide-content">
                  <section class="slide-content__interactive">
                    <h3 class="slide-date" v-if="item?.datetime">
                      {{ formatDate(item.datetime) }}
                    </h3>
                    <h3 class="slide-date" v-else-if="item?._updatedAt">
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
                  <NuxtLink
                    v-if="
                      item?.clickableTitle &&
                      item?.parentShow?.title !== 'No Show'
                    "
                    :to="
                      localePath(`/shows/no-show/${item?.parentShow?.slug?.current}`)
                    "
                    class="slide__link"
                  >
                    <h3 class="slide-title show-title">
                      {{ item?.parentShow?.title }}
                    </h3>
                  </NuxtLink>
                  <h3
                    v-else-if="
                      item?.parentShow && item?.parentShow?.title !== 'No Show'
                    "
                    class="slide-title show-title"
                  >
                    {{ item?.parentShow?.title }}
                  </h3>
                  <NuxtLink
                    v-if="item?.slug"
                    :to="getItemRoute(item)"
                    class="slide__link"
                  >
                    <h3 class="slide-title" v-if="contentType !== 'sets'">
                      {{ item?.title }}
                    </h3>
                  </NuxtLink>
                  <h3 class="slide-title" v-else-if="contentType !== 'sets'">
                    {{ item?.title }}
                  </h3>
                  <div
                    v-if="
                      contentType === 'sets' &&
                      item.persons &&
                      item.persons.length > 0
                    "
                    class="show-artists"
                  >
                    <h3
                      v-for="(artist, index) in item.persons"
                      :key="artist._id"
                      class="slide-title"
                    >
                      <NuxtLink
                        v-if="artist?.poolVisibility"
                        :to="localePath(`/pool/${artist?.slug?.current}`)"
                        class="slide__link"
                      >
                        {{ artist.title
                        }}{{ index < item.persons.length - 1 ? "," : "" }}&nbsp;
                      </NuxtLink>
                      <span v-else class="slide-title">
                        {{ artist.title
                        }}{{ index < item.persons.length - 1 ? "," : "" }}&nbsp;
                      </span>
                    </h3>
                  </div>
                  <RichText
                    v-if="item?.useTeaserText && item?.textTeaser"
                    :blocks="parseI18nObj(item?.textTeaser)"
                  />
                  <RichText
                    v-else-if="
                      !item?.useTeaserText && item?.text && item.text.length > 0
                    "
                    :blocks="parseI18nObj(item?.text)?.slice(0, 1)"
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
                        parseI18nObj(item?.description)?.slice(0, 1),
                        100
                      )
                    "
                  />
                  <RichText
                    v-else-if="
                      !item?.text &&
                      module.poolContentType == 'persons' &&
                      mainStore?.siteFallbacks?.fallbackPerson?.description
                        .length > 0 &&
                      (mainStore?.siteFallbacks?.fallbackPerson
                        ?.description?.[0]?.value ||
                        mainStore?.siteFallbacks?.fallbackPerson
                          ?.description?.[1]?.value)
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
                      module.poolContentType == 'venues' &&
                      mainStore?.siteFallbacks?.fallbackVenue?.description
                        .length > 0 &&
                      (mainStore?.siteFallbacks?.fallbackVenue?.description?.[0]
                        ?.value ||
                        mainStore?.siteFallbacks?.fallbackPerson
                          ?.description?.[1]?.value)
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
    <!-- Mobile Version (v-show wenn < 900px) -->
    <div v-show="!isDesktop" class="mobile-slider">
      <nav class="embla__nav">
        <!-- Mobile Dot Navigation -->
        <div class="embla__nav__dots" v-if="mobileScrollSnaps.length > 1">
          <button
            v-for="(_, index) in mobileScrollSnaps"
            :key="index"
            :class="[
              'embla__dot',
              { 'is-selected': index === mobileSelectedIndex },
            ]"
            @click="mobileScrollTo(index)"
          ></button>
        </div>

        <!-- Mobile Arrow Navigation -->
        <div class="embla__nav__arrows" v-if="mobileScrollSnaps.length > 1">
          <button
            class="embla__arrow embla__arrow--prev"
            @click="mobileScrollPrev"
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
            @click="mobileScrollNext"
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

      <div ref="mobileEmblaNode" class="embla">
        <div ref="mobileContainer" class="embla__container">
          <div
            v-for="(group, groupIndex) in mobileGroupedItems"
            :key="groupIndex"
            class="embla__slide"
            :class="{ active: groupIndex === mobileCurrentIndex }"
          >
            <div
              :class="`slide-group mobile-group-${module.style || 'default'}`"
            >
              <!-- Mobile Slider-Inhalt (ein Item pro Slide) -->
              <div
                v-for="item in group"
                :key="item._id"
                :class="`slide-item mobile-slide-${module.style || 'default'}`"
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
                <NuxtLink
                  v-if="item?.slug"
                  :to="getItemRoute(item)"
                  class="slide__link"
                >
                  <MediaImage
                    v-if="getItemImage(item) && categoryType !== 'Episodes'"
                    :image="getItemImage(item)"
                    :class="`media-${module.style}`"
                  />
                  <img
                    v-else-if="
                      categoryType === 'Episodes' && artworkUrls.get(item._id)
                    "
                    :src="artworkUrls.get(item._id)"
                    alt="Episode Image"
                    class="track-artwork"
                  />
                  <div
                    v-else-if="categoryType === 'Episodes'"
                    class="track-artwork-placeholder"
                    @vue:mounted="loadArtworkUrl(item)"
                  ></div>
                </NuxtLink>
                <div class="slide-content">
                  <section class="slide-content__interactive">
                    <h3 class="slide-date" v-if="item?.datetime">
                      {{ formatDate(item.datetime) }}
                    </h3>
                    <h3 class="slide-date" v-else-if="item?._updatedAt">
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
                  <NuxtLink
                    v-if="item?.parentShow?.slug && item?.clickableTitle && item?.parentShow?.title !== 'No Show'"
                    :to="localePath(`/shows/${item?.parentShow?.slug.current}`)"
                    class="slide__link"
                  >
                    <h3 class="slide-title show-title">
                      {{ item?.parentShow?.title }}
                    </h3>
                  </NuxtLink>
                  <h3
                    v-else-if="
                      item?.parentShow && item?.parentShow?.title !== 'No Show'
                    "
                    class="slide-title show-title"
                  >
                    {{ item?.parentShow?.title }}
                  </h3>
                  <NuxtLink
                    v-if="item?.slug"
                    :to="getItemRoute(item)"
                    a
                    class="slide__link"
                  >
                    <h3 class="slide-title" v-if="contentType !== 'sets'">
                      {{ item?.title }}
                    </h3>
                  </NuxtLink>
                  <h3 class="slide-title" v-else-if="contentType !== 'sets'">
                    {{ item?.title }}
                  </h3>
                  <div
                    v-if="
                      contentType === 'sets' &&
                      item.persons &&
                      item.persons.length > 0
                    "
                    class="show-artists"
                  >
                    <h3
                      v-for="(artist, index) in item.persons"
                      :key="artist._id"
                      class="slide-title"
                    >
                      <NuxtLink
                        v-if="artist?.poolVisibility"
                        :to="localePath(`/pool/${artist?.slug?.current}`)"
                        class="slide__link"
                      >
                        {{ artist.title
                        }}{{ index < item.persons.length - 1 ? "," : "" }}&nbsp;
                      </NuxtLink>
                      <span v-else class="slide-title">
                        {{ artist.title
                        }}{{ index < item.persons.length - 1 ? "," : "" }}&nbsp;
                      </span>
                    </h3>
                  </div>
                  <RichText
                    v-if="item?.useTeaserText && item?.textTeaser"
                    :blocks="parseI18nObj(item?.textTeaser)"
                  />
                  <RichText
                    v-else-if="
                      !item?.useTeaserText && item?.text && item.text.length > 0
                    "
                    :blocks="parseI18nObj(item?.text)?.slice(0, 1)"
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
                        parseI18nObj(item?.description)?.slice(0, 1),
                        100
                      )
                    "
                  />
                  <RichText
                    v-else-if="
                      !item?.text &&
                      module.poolContentType == 'persons' &&
                      mainStore?.siteFallbacks?.fallbackPerson?.description
                        .length > 0 &&
                      (mainStore?.siteFallbacks?.fallbackPerson
                        ?.description?.[0]?.value ||
                        mainStore?.siteFallbacks?.fallbackPerson
                          ?.description?.[1]?.value)
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
                      module.poolContentType == 'venues' &&
                      mainStore?.siteFallbacks?.fallbackVenue?.description
                        .length > 0 &&
                      (mainStore?.siteFallbacks?.fallbackVenue?.description?.[0]
                        ?.value ||
                        mainStore?.siteFallbacks?.fallbackPerson
                          ?.description?.[1]?.value)
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
  </div>
</template>

<style lang="postcss" scoped>
.module-carousel {
  @apply overflow-hidden;
  max-width: clamp(100%, 100%, var(--page-max-width));
  /* margin: var(--mid-margin) 0; */

  &--cards {
    &.embla {
      .embla__slide {
        :deep(img),
        :deep(.video-wrapper) {
          aspect-ratio: 3 / 4 !important;
        }
        .slide-group {
          width: 100%;
          .slide-item {
            max-width: calc(33% - var(--big-padding));
            h2,
            h3 {
              font-family: var(--font-text-semibold);
              font-weight: 550;
            }
            &:first-child {
              padding: 0 var(--big-margin) 0 0;
              border-right: 1px solid var(--color-text);
            }
            &:last-child {
              padding: 0 0 0 var(--big-margin);
              border-left: 1px solid var(--color-text);
            }
            .slide-content {
              flex-grow: 1;
            }
          }
        }
      }
    }
  }
  &--thumbnails {
    &.embla {
      .embla__slide {
        min-height: 100%;
        :deep(img),
        :deep(.video-wrapper) {
          aspect-ratio: 1 / 1 !important;
          object-fit: cover;
          @apply max-w-full:;
        }
        .slide-group {
          .slide-item {
            max-width: calc(100% / 3);
            &:first-child {
              padding: 0 var(--big-margin) 0 0;
            }
            &:last-child {
              padding: 0 0 0 var(--big-margin);
            }
            .slide-content {
              gap: 0;
              flex-grow: 1;
              h2,
              h3 {
                font-family: var(--font-text-semibold);
                font-weight: 550;
              }
              &__interactive {
                width: 100%;
                display: flex;
                flex-flow: row wrap;
                justify-content: space-between;
                align-items: center;
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
                  @media screen and (max-width: 900px) {
                    width: calc(var(--h3-size) + 4px);
                    height: calc(var(--h3-size) + 4px);
                  }

                  svg {
                    height: var(--base-font-size);
                    transform: translate(1px, 0);
                    @media screen and (max-width: 900px) {
                      height: var(--h3-size);
                    }
                    rect,
                    path {
                      fill: var(--color-bg);
                    }
                  }
                }
              }
              .slide-title {
                margin: 0 0 calc(var(--small-padding) / 2) 0;
              }
              &__interactive,
              .show-artists {
                margin: 0 0 var(--mid-padding) 0;
              }
              .show-artists {
                display: flex;
                flex-flow: row wrap;
                justify-content: flex-start;
                align-items: center;
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
            @media (min-width: 1024px) {
              @apply bg-gray-400;
            }
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
        object-fit: cover;
        @apply max-w-full w-100;
      }

      opacity: 0;
      transition: opacity 0.15s ease !important;

      &.active {
        opacity: 1;
        transition: opacity 1.5s ease !important;
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
          /* flex-grow: 1; */
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
  .mobile-slider {
    width: 100%;
    overflow: hidden;

    .embla {
      overflow: hidden;
      margin-left: calc(var(--big-margin) * -0.5);
      max-width: calc(var(--page-max-width) + var(--big-margin));
      width: calc(var(--page-max-width) + var(--big-margin));

      .embla__container {
        display: flex;
        backface-visibility: hidden;
        touch-action: pan-y;
      }

      .embla__slide {
        flex: 0 0 auto;
        min-width: 0;
        position: relative;
        width: 100%; /* Ein Slide nimmt die volle Breite ein */
        padding: 0 calc(var(--big-margin) / 2);

        opacity: 0;
        transition: opacity 0.15s ease !important;

        &.active {
          opacity: 1;
          transition: opacity 1.5s ease !important;
        }

        .slide-group {
          display: flex;
          width: 100%;
          justify-content: center;
          flex-direction: column;
        }

        .slide-item {
          width: 100%;
          max-width: 100%;
          display: flex;
          flex-flow: column wrap;
          justify-content: center;
          align-items: center;

          &:first-child,
          &:last-child {
            padding: 0;
            border: none;
          }

          .slide__link {
            width: 100%;
            /* max-width: calc(100svw - var(--big-margin) * 2); */
          }

          :deep(img),
          :deep(.video-wrapper) {
            width: 100%;
            /* max-width: calc(100svw - var(--big-margin) * 2); */
          }

          .slide-content {
            width: 100%;
            padding: var(--mid-margin) 0 0 0;
            display: flex;
            flex-flow: column wrap;
            justify-content: flex-start;
            align-items: flex-start;
            margin: var(--mid-padding) 0 0 0;
            /* @media screen and (max-width: 900px) {
              padding: var(--base-padding) var(--big-margin);
            } */
          }
        }
      }

      &__nav {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-end;
        margin: calc((1.25rem - var(--base-font-size)) / 2) 0 var(--base-margin);
        /* @media screen and (max-width: 900px) {
          padding: 0 var(--big-margin);
        } */

        .embla__nav__dots {
          display: none;
          /* display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-grow: 1;
          gap: 0 var(--small-padding);

          .embla__dot {
            border-radius: 9999px;
            transition-property: background-color;
            width: 7px;
            height: 7px;
            background-color: var(--color-grey);

            &.is-selected {
              background-color: var(--color-text);
            }

            &:hover {
              background-color: #9ca3af;
            }
          } */
        }

        .embla__nav__arrows {
          display: flex;
          gap: 0 var(--big-padding);
          margin: 0 var(--small-padding) 0 0;

          .embla__arrow {
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 9999px;
            transition-property: background-color;
            background-color: transparent;

            svg {
              width: 1.25rem;
              height: 1.25rem;

              path {
                fill: var(--color-text);
              }
            }

            &:focus {
              outline: none;
              --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0
                var(--tw-ring-offset-width) var(--tw-ring-offset-color);
              --tw-ring-shadow: var(--tw-ring-inset) 0 0 0
                calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
              box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow),
                var(--tw-shadow, 0 0 #0000);
              --tw-ring-opacity: 0.5;
              --tw-ring-color: rgba(0, 0, 0, var(--tw-ring-opacity));
            }
          }
        }
      }
    }
  }

  /* Style-Anpassungen für verschiedene Slider-Typen im mobilen Kontext */
  .mobile-slider {
    .module-carousel--image,
    .module-carousel--thumbnails,
    .module-carousel--cards {
      .embla__slide {
        .slide-group {
          .slide-item {
            max-width: 100%;

            &:first-child,
            &:last-child {
              padding: 0;
              border: none;
            }

            .slide-content {
              width: 100%;
            }
          }
        }
      }
    }
  }
}
</style>