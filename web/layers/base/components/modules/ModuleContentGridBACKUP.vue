<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useMainStore } from "~/stores/mainStore";

const mainStore = useMainStore();

const props = defineProps({
  module: {
    type: Object,
    required: true,
  },
});

// Filter-Zustand
const activeFilters = ref(new Set());
const activeSubFilters = ref(false);
const mainCities = ["Düsseldorf", "Leipzig", "Vienna"]; // Hauptstädte definieren
const isOtherCitiesActive = ref(false); // Zustand für "Others"-Filter

// Filter nach Kategorien organisieren
const filterCategories = {
  city: new Set(),
  genre: new Set(),
  subGenre: new Set(),
  mood: new Set(),
  global: new Set(),
};

// Funktion zum Ermitteln, ob ein City-Tag eine Hauptstadt ist
function isMainCity(cityTag) {
  // Sicherheitsabfrage
  if (!cityTag || !cityTag.title) return false;

  // Versuche den Titel zu parsen, falls es ein I18N-Objekt ist
  let cityName = cityTag.title;
  try {
    if (typeof parseI18nObj === "function") {
      cityName = parseI18nObj(cityTag.title);
    } else if (typeof cityTag.title === "object" && cityTag.title.de) {
      // Fallback falls parseI18nObj nicht verfügbar ist
      cityName =
        cityTag.title.de || cityTag.title.en || Object.values(cityTag.title)[0];
    }
  } catch (e) {
    console.error("Fehler beim Parsen des Stadtnamens:", e);
  }

  // Prüfe, ob der Stadtname in der Liste der Hauptstädte enthalten ist
  return mainCities.includes(cityName);
}

// Funktion zum Ermitteln der Kategorie eines Tags
function getTagCategory(tagId) {
  // Spezialfall für "others"
  if (tagId === "others") {
    return "city"; // Wichtig: Der "others"-Filter ist ein Stadt-Filter
  }

  // Prüfen, ob der Tag eine Stadt ist
  if (categorizedTags.value.cities.some((tag) => tag._id === tagId)) {
    return "city";
  }

  // Prüfen, ob der Tag ein Genre ist
  if (categorizedTags.value.genres.some((tag) => tag._id === tagId)) {
    return "genre";
  }

  // Prüfen, ob der Tag ein SubGenre ist
  for (const genre of categorizedTags.value.genres) {
    if (genre.subGenres && genre.subGenres.some((tag) => tag._id === tagId)) {
      return "subGenre";
    }
  }

  // Prüfen, ob der Tag ein Mood ist
  if (
    categorizedTags.value.mood &&
    categorizedTags.value.mood.some((tag) => tag._id === tagId)
  ) {
    return "mood";
  }

  // Ansonsten ist es ein globaler Tag
  return "global";
}

function getTagNameById(tagId) {
  // Spezialfall für "others"
  if (tagId === "others") {
    return "Andere Städte";
  }

  // Suche in allen Kategorien nach dem Tag
  // Städte
  const cityTag = categorizedTags.value.cities.find((tag) => tag._id === tagId);
  if (cityTag) return parseI18nObj(cityTag.title);

  // Genres
  const genreTag = categorizedTags.value.genres.find(
    (tag) => tag._id === tagId
  );
  if (genreTag) return genreTag.title;

  // SubGenres
  for (const genre of categorizedTags.value.genres) {
    if (genre.subGenres) {
      const subGenreTag = genre.subGenres.find((tag) => tag._id === tagId);
      if (subGenreTag) return subGenreTag.title;
    }
  }

  // Mood
  const moodTag = categorizedTags.value.mood?.find((tag) => tag._id === tagId);
  if (moodTag) return moodTag.title;

  // Global
  const globalTag = categorizedTags.value.global?.find(
    (tag) => tag._id === tagId
  );
  if (globalTag) return globalTag.title;

  // Fallback
  return "Unbekannter Filter";
}

// Kategorisierte verfügbare Tags basierend auf den vordefinierten Tags in der Abfrage
const categorizedTags = computed(() => {
  if (!props.module || !props.module.availableTags) {
    return { genres: [], cities: [], global: [] };
  }

  const usedTagIds = getUsedTagIdsInItems.value;

  // Genres mit verwendeten SubGenres filtern
  const genres = props.module.availableTags.genres
    .map((genre) => {
      // Prüfe, ob Genre direkt verwendet wird
      const isGenreUsed = usedTagIds.has(genre._id);

      // Filtriere verwendete SubGenres
      const usedSubGenres = genre.subGenres
        ? genre.subGenres.filter((subGenre) => usedTagIds.has(subGenre._id))
        : [];

      // Genre nur einschließen, wenn es verwendet wird oder SubGenres hat
      if (isGenreUsed || usedSubGenres.length > 0) {
        return {
          ...genre,
          subGenres: usedSubGenres,
        };
      }

      return null;
    })
    .filter(Boolean); // Null-Einträge entfernen

  // Verwendete Städte filtern
  const cities = props.module.availableTags.cities
    ? props.module.availableTags.cities.filter((city) =>
        usedTagIds.has(city._id)
      )
    : [];

  // Globale Tags filtern
  const global = props.module.availableTags.global
    ? props.module.availableTags.global.filter((tag) => usedTagIds.has(tag._id))
    : [];

  // Weitere Tag-Typen je nach Bedarf filtern
  const mood = props.module.availableTags.mood
    ? props.module.availableTags.mood.filter((tag) => usedTagIds.has(tag._id))
    : [];

  return {
    genres,
    cities,
    global,
    mood,
  };
});

// Alle verfügbaren Tags für andere Content-Typen
const availableTags = computed(() => {
  if (!props.module || !props.module.availableTags) return [];

  const usedTagIds = getUsedTagIdsInItems.value;
  const allAvailableTags = [];

  // Alle Tag-Kategorien durchgehen
  Object.entries(props.module.availableTags).forEach(([category, tags]) => {
    if (Array.isArray(tags)) {
      tags.forEach((tag) => {
        if (usedTagIds.has(tag._id)) {
          allAvailableTags.push(tag);
        }
      });
    }
  });

  return allAvailableTags;
});

// Modifizierte ToggleFilter-Funktion
function toggleFilter(tagId) {
  const category = getTagCategory(tagId);

  // Wenn der Tag bereits aktiv ist, nur diesen entfernen
  if (activeFilters.value.has(tagId)) {
    activeFilters.value.delete(tagId);
    filterCategories[category].delete(tagId);

    // "Others"-Filter-Status zurücksetzen
    if (tagId === "others") {
      isOtherCitiesActive.value = false;
    }
  } else {
    // Wenn eine neue Auswahl getroffen wird, vorherige in derselben Kategorie löschen
    filterCategories[category].forEach((id) => {
      activeFilters.value.delete(id);
    });

    // Zurücksetzen des "Others"-Status wenn ein Stadt-Filter aktiviert wird
    if (category === "city") {
      isOtherCitiesActive.value = tagId === "others";
    }

    // Kategorie-Set zurücksetzen und neuen Tag hinzufügen
    filterCategories[category].clear();
    filterCategories[category].add(tagId);
    activeFilters.value.add(tagId);
  }

  // Aktualisiere gefilterte Items
  visibleItemCount.value = itemsPerPage; // Zurücksetzen auf Anfangsmenge
}

//Toggle SubFilter
function toggleSubFilter(subFilterId) {
  activeSubFilters.value = subFilterId;
}

// Zurücksetzen aller Filter
function resetFilters() {
  activeFilters.value.clear();
  Object.values(filterCategories).forEach((categorySet) => categorySet.clear());
  isOtherCitiesActive.value = false;
}

// Anzahl der anzuzeigenden Items steuern
const itemsPerPage = 9;
const visibleItemCount = ref(itemsPerPage);

// Funktion zum Laden weiterer Items
function loadMoreItems() {
  visibleItemCount.value += itemsPerPage;
}

// Hilfsfunktion zur Formatierung von Datum/Zeit
function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  // Überprüfen, ob das Datum gültig ist
  if (isNaN(date.getTime())) return "";

  // Format: DD.MM.YYYY
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

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

const artworkUrls = ref(new Map());

// Funktion zum Abrufen und Speichern der Artwork-URL
async function loadArtworkUrl(item) {
  if (!item) return;
  const url = await getSoundcloudArtwork(item);
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

async function getSoundcloudArtwork(item) {
  // Definiere die Fallback-URLs explizit
  const parentShowImageUrl = item?.parentShow?.image?.asset?.url;
  const storeFallbackUrl =
    mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url;
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

// Content-Typ-spezifische Tags (ohne Cities)
const getContentTypeSpecificTags = computed(() => {
  if (!availableTags.value) return [];

  // Filtere Cities aus, da sie bereits separat angezeigt werden
  return availableTags.value.filter((tag) => tag._type !== "tag.city");
});

// Hilfsfunktion zum Ermitteln der verwendeten Tag-IDs in den Items
const getUsedTagIdsInItems = computed(() => {
  const usedTagIds = new Set();

  allItems.value.forEach((item) => {
    // Direkte Tags am Item
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach((tag) => {
        if (tag && tag._id) {
          usedTagIds.add(tag._id);
        }
      });
    }

    // Tags aus parentShow (falls vorhanden)
    if (
      item.parentShow &&
      item.parentShow.tags &&
      Array.isArray(item.parentShow.tags)
    ) {
      item.parentShow.tags.forEach((tag) => {
        if (tag && tag._id) {
          usedTagIds.add(tag._id);
        }
      });
    }
  });

  return usedTagIds;
});

// Prüft, ob ein Item City-Tags hat (direkt oder über parentShow)
function itemHasCityTags(item) {
  // Direkte City-Tags prüfen
  if (item.tags && Array.isArray(item.tags)) {
    if (item.tags.some((tag) => tag._type === "tag.city")) {
      return true;
    }
  }

  // Tags aus parentShow prüfen
  if (
    item.parentShow &&
    item.parentShow.tags &&
    Array.isArray(item.parentShow.tags)
  ) {
    if (item.parentShow.tags.some((tag) => tag._type === "tag.city")) {
      return true;
    }
  }

  return false;
}

// Gibt alle City-Tags eines Items zurück (direkt + parentShow)
function getItemCityTags(item) {
  const cityTags = [];

  // Direkte City-Tags
  if (item.tags && Array.isArray(item.tags)) {
    item.tags.forEach((tag) => {
      if (tag._type === "tag.city") {
        cityTags.push(tag);
      }
    });
  }

  // City-Tags aus parentShow
  if (
    item.parentShow &&
    item.parentShow.tags &&
    Array.isArray(item.parentShow.tags)
  ) {
    item.parentShow.tags.forEach((tag) => {
      if (tag._type === "tag.city") {
        // Nur hinzufügen, wenn es nicht bereits enthalten ist
        if (!cityTags.some((existingTag) => existingTag._id === tag._id)) {
          cityTags.push(tag);
        }
      }
    });
  }

  return cityTags;
}

// Prüft, ob ein Item den aktiven Filtern entspricht
function itemMatchesFilters(item) {
  if (activeFilters.value.size === 0) {
    return true; // Keine Filter aktiv, alle Items anzeigen
  }

  // Spezialbehandlung wenn nur der Others-Filter aktiv ist
  if (activeFilters.value.size === 1 && activeFilters.value.has('others')) {
    const cityTags = getItemCityTags(item);
    // Item passt zu Others, wenn es keine Städte hat oder wenn keine der Städte eine Hauptstadt ist
    return cityTags.length === 0 || cityTags.every(tag => !isMainCity(tag));
  }

  // Standard-Filterlogik für alle anderen Filter
  for (const filterId of activeFilters.value) {
    let hasMatchingTag = false;

    // Überspringen des Others-Filters in der normalen Logik
    if (filterId === 'others') {
      continue;
    }

    // Normale Filter-Überprüfung
    // Prüfe direkte Tags
    if (item.tags && Array.isArray(item.tags)) {
      if (item.tags.some((tag) => tag._id === filterId)) {
        hasMatchingTag = true;
      }
    }

    // Prüfe Tags aus parentShow
    if (
      !hasMatchingTag &&
      item.parentShow &&
      item.parentShow.tags &&
      Array.isArray(item.parentShow.tags)
    ) {
      if (item.parentShow.tags.some((tag) => tag._id === filterId)) {
        hasMatchingTag = true;
      }
    }

    if (!hasMatchingTag) {
      return false; // Dieser Filter wird nicht erfüllt
    }
  }

  return true; // Alle Filter werden erfüllt
}
// Gibt alle nicht-City-Tags eines Items zurück
function getItemNonCityTags(item) {
  if (!item.tags || !Array.isArray(item.tags)) return [];

  return item.tags.filter((tag) => tag._type !== "tag.city");
}

// Funktion zum Filtern der Items nach Typ
function filterItems(items, contentType = null) {
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

  return filteredItems;
}

// Berechne alle Items nach Typ
const allItems = computed(() => {
  if (!props.module) return [];

  switch (props.module.type) {
    case "pool":
      return filterItems(
        props.module.poolItems || [],
        props.module.poolContentType
      );
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

// Berechne die gefilterten Items
const filteredItems = computed(() => {
  return allItems.value.filter((item) => itemMatchesFilters(item));
});

// Berechne die sichtbaren Items (basierend auf den gefilterten Items)
const visibleItems = computed(() => {
  return filteredItems.value.slice(0, visibleItemCount.value);
});

// Prüfen, ob mehr Items geladen werden können
const hasMoreItems = computed(() => {
  return visibleItems.value.length < filteredItems.value.length;
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
  }
}
</script>
<template>
  <div
    v-if="module"
    :class="`content-grid module-grid module-grid--${
      module.style || 'default'
    } ${categoryType.toLowerCase()}`"
  >
    <div class="module-grid__header">
      <h3 v-if="module.title" class="module-grid__title">
        {{ module.title }}
      </h3>
      <section
        v-if="categoryType == 'Episodes'"
        class="module-grid__header__type"
      >
        <h2 class="module-grid__header__type__pill">Shows</h2>
      </section>
      <section v-else class="module-grid__header__type">
        <h2 class="module-grid__header__type__pill">{{ categoryType }}</h2>
      </section>
    </div>

    <!-- Filter Panel -->
    <div v-if="activeFilters.size > 0" class="active-filters">
      <h4 class="active-filters__title">Aktive Filter:</h4>
      <div class="active-filters__list">
        <div
          v-for="filterId in activeFilters"
          :key="filterId"
          class="active-filter"
        >
          <span class="active-filter__name">
            {{ getTagNameById(filterId) }}
          </span>
          <button class="active-filter__remove" @click="toggleFilter(filterId)">
            &times;
          </button>
        </div>
      </div>
    </div>
    <div
      v-if="allItems.length > 0 && module.availableTags"
      class="content-grid__filters"
    > 
      <div
        v-if="contentType === 'sets'"
        class="debug-info"
        style="margin-bottom: 10px; padding: 10px; border: 1px dashed #999"
      >
        <p>Stadt-Tags Sampling:</p>
        <ul>
          <li v-for="item in allItems.slice(0, 3)" :key="item._id">
            <strong>{{ item.title }}</strong>
            <div v-if="item.parentShow?.city">
              <p>
                Hat city: {{ JSON.stringify(item.parentShow.city, null, 2) }}
              </p>
            </div>
            <div v-else>
              <p>Keine city</p>
            </div>
          </li>
        </ul>
        <p>Verfügbare Städte: {{ categorizedTags.cities?.length || 0 }}</p>
        <p>
          Items mit Stadt-Tags:
          {{ allItems.filter((item) => itemHasCityTags(item)).length }}
        </p>
      </div>

      <div class="filter-container tags">
        <!-- City Tags - immer verfügbar -->
        <div
          v-if="categorizedTags.cities && categorizedTags.cities.length > 0"
          class="filter-category"
        >
          <h4 class="filter-category__title">Cities</h4>
          <div class="filter-tags">
            <!-- Hauptstädte anzeigen -->
            <button
              v-for="tag in categorizedTags.cities.filter((tag) =>
                isMainCity(tag)
              )"
              :key="tag._id"
              :class="[
                'filter-tag',
                'filter-tag--city',
                { 'filter-tag--active': activeFilters.has(tag._id) },
              ]"
              @click="toggleFilter(tag._id)"
            >
              {{ parseI18nObj(tag.title) }}
            </button>

            <!-- "Others"-Option anzeigen, wenn es Tags gibt, die keine Hauptstädte sind -->
            <button
              v-if="categorizedTags.cities.some((tag) => !isMainCity(tag))"
              :class="[
                'filter-tag',
                'filter-tag--city',
                { 'filter-tag--active': isOtherCitiesActive },
              ]"
              @click="toggleFilter('others')"
            >
              Others
            </button>
          </div>
        </div>

        <!-- Filter für Sets mit verschachtelten Genres -->
        <template v-if="contentType === 'sets'">
          <!-- Genre mit Subgenres -->
          <div
            v-if="categorizedTags.genres && categorizedTags.genres.length > 0"
            class="filter-category"
          >
            <div class="filter-genres">
              <div
                v-for="genre in categorizedTags.genres"
                :key="genre._id"
                class="filter-genre"
              >
                <button
                  class="tag"
                  :class="[
                    'filter-tag',
                    'filter-tag--genre',
                    { 'filter-tag--active': activeFilters.has(genre._id) },
                  ]"
                  @click="toggleSubFilter(genre._id)"
                >
                  {{ genre.title }}
                </button>
              </div>
            </div>

            <div class="filter-subgenres">
              <div
                v-for="genre in categorizedTags.genres"
                :key="genre._id"
                class="filter-genre"
              >
                <!-- Subgenres -->
                <div
                  v-if="
                    genre.subGenres &&
                    genre.subGenres.length > 0 &&
                    activeSubFilters == genre._id
                  "
                  class="filter-subgenres"
                >
                  <button
                    v-for="subGenre in genre.subGenres"
                    :key="subGenre._id"
                    class="tag"
                    :class="[
                      'filter-tag',
                      'filter-tag--subgenre',
                      { 'filter-tag--active': activeFilters.has(subGenre._id) },
                    ]"
                    @click="toggleFilter(subGenre._id)"
                  >
                    {{ subGenre.title }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Mood Tags -->
          <div
            v-if="categorizedTags.mood && categorizedTags.mood.length > 0"
            class="filter-category"
          >
            <h4 class="filter-category__title">Mood</h4>
            <div class="filter-tags">
              <button
                v-for="tag in categorizedTags.mood"
                :key="tag._id"
                :class="[
                  'filter-tag',
                  { 'filter-tag--active': activeFilters.has(tag._id) },
                ]"
                @click="toggleFilter(tag._id)"
              >
                {{ tag.title }}
              </button>
            </div>
          </div>

          <!-- Globale Tags -->
          <div
            v-if="categorizedTags.global && categorizedTags.global.length > 0"
            class="filter-category"
          >
            <h4 class="filter-category__title">Tags</h4>
            <div class="filter-tags">
              <button
                v-for="tag in categorizedTags.global"
                :key="tag._id"
                :class="[
                  'filter-tag',
                  { 'filter-tag--active': activeFilters.has(tag._id) },
                ]"
                @click="toggleFilter(tag._id)"
              >
                {{ tag.title }}
              </button>
            </div>
          </div>
        </template>

        <!-- Einfache Filter für andere Inhaltstypen (außer Cities, die bereits oben angezeigt werden) -->
        <template v-else>
          <div
            v-if="getContentTypeSpecificTags.length > 0"
            class="filter-category"
          >
            <h4 class="filter-category__title">Tags</h4>
            <div class="filter-tags">
              <button
                v-for="tag in getContentTypeSpecificTags"
                :key="tag._id"
                :class="[
                  'filter-tag',
                  { 'filter-tag--active': activeFilters.has(tag._id) },
                ]"
                @click="toggleFilter(tag._id)"
              >
                {{ tag.title }}
              </button>
            </div>
          </div>
        </template>

        <!-- Filter zurücksetzen -->
        <button
          v-if="activeFilters.size > 0"
          class="filter-reset"
          @click="resetFilters"
        >
          Reset Filters
        </button>
      </div>
    </div>

    <div class="content-grid__container">
      <div v-if="visibleItems.length > 0" class="content-grid__items">
        <div
          v-for="item in visibleItems"
          :key="item._id"
          :class="`grid-item grid-item--${module.style || 'default'}`"
        >
          <NuxtLink
            v-if="item.slug"
            :to="`/${item._type}/${item.slug.current}`"
            class="grid-item__link"
          >
            <!-- Bild -->
            <div class="grid-item__image">
              <img
                v-if="item.image && item.image.asset"
                :src="item.image.asset.url"
                :alt="item.title || ''"
              />
              <div
                v-else-if="contentType === 'sets' && item.soundcloud"
                class="track-artwork"
                @vue:mounted="loadArtworkUrl(item)"
              >
                <img
                  v-if="artworkUrls.get(item._id)"
                  :src="artworkUrls.get(item._id)"
                  alt="Track Artwork"
                />
              </div>
            </div>

            <!-- Inhalt -->
            <div class="grid-item__content">
              <!-- Städte Tags wenn vorhanden -->
              <div
                v-if="itemHasCityTags(item)"
                class="grid-item__tags city-tags"
              >
                <span
                  v-for="tag in getItemCityTags(item)"
                  :key="tag._id"
                  class="tag city"
                >
                  {{ tag.title }}
                </span>
              </div>

              <!-- Datum (falls vorhanden) -->
              <div
                v-if="item.datetime || item.publishedAt"
                class="grid-item__date"
              >
                {{ formatDate(item.datetime || item.publishedAt) }}
              </div>

              <!-- Show-Titel (für Sets) -->
              <h3 v-if="item.parentShow" class="grid-item__title show-title">
                {{ item.parentShow.title }}
              </h3>

              <!-- Künstler (für Sets) -->
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
                  class="grid-item__title"
                >
                  {{ artist.title
                  }}{{ index < item.persons.length - 1 ? ", " : "" }}
                </h3>
              </div>

              <!-- Titel für alle anderen Content-Typen -->
              <h3 v-else class="grid-item__title">
                {{ item.title || item.name }}
              </h3>

              <!-- Play-Button für Sets -->
              <button
                v-if="contentType === 'sets' && item.soundcloud"
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
                  <path
                    d="M9 6L0 11.1962L0 0.803847L9 6Z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              <!-- Nicht-City Tags anzeigen -->
              <div
                v-if="module.showTags && getItemNonCityTags(item).length > 0"
                class="grid-item__tags"
              >
                <span
                  v-for="tag in getItemNonCityTags(item)"
                  :key="tag._id"
                  class="tag"
                >
                  {{ tag.title }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
      <div v-else class="content-grid__no-results">
        Keine Ergebnisse für die aktuelle Filterauswahl.
      </div>

      <div v-if="hasMoreItems" class="content-grid__load-more">
        <button @click="loadMoreItems" class="load-more-button">
          <span class="plus-icon">+</span> Load More
        </button>
      </div>
    </div>
  </div>
</template>
<style lang="postcss" scoped>
.content-grid {
  @apply overflow-hidden;
  max-width: clamp(100%, 100%, var(--page-max-width));

  &__no-results {
    padding: var(--mid-padding);
    text-align: center;
    border: 1px dashed var(--color-text);
    margin-bottom: var(--mid-margin);
  }

  &__filters {
    margin-bottom: var(--mid-margin);

    .filter-tag--city {
      border-color: var(--color-secondary);

      &:hover {
        background-color: var(--color-secondary);
      }

      &.filter-tag--active {
        background-color: var(--color-secondary);
      }
    }

    .filter-container {
      display: flex;
      flex-direction: column;
      gap: var(--mid-padding);
    }

    .filter-category {
      display: flex;
      flex-direction: column;
      gap: var(--small-padding);

      &__title {
        font-size: var(--small-font-size);
        font-family: var(--font-text-semibold);
        text-transform: uppercase;
        margin-bottom: var(--small-padding);
      }

      &__toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;

        &:hover .filter-category__title {
          text-decoration: underline;
        }
      }

      &__icon {
        font-size: 1.2rem;
        font-weight: bold;
      }
    }

    .filter-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--small-padding);
    }

    .filter-genres {
      display: flex;
      flex-direction: column;
      gap: var(--small-padding);
    }

    .filter-genre {
      display: flex;
      flex-direction: column;
      gap: calc(var(--small-padding) / 2);
    }

    .filter-subgenres {
      margin-left: var(--mid-padding);
      display: flex;
      flex-wrap: wrap;
      gap: var(--small-padding);
    }

    .filter-tag {
      padding: 2px 8px;
      font-size: var(--small-font-size);
      background-color: transparent;
      border: 1px solid var(--color-text);
      color: var(--color-text);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--color-text);
        color: var(--color-bg);
      }

      &--active {
        background-color: var(--color-text);
        color: var(--color-bg);
      }

      &--genre {
        font-weight: 600;
      }

      &--subgenre {
        font-size: calc(var(--small-font-size) - 1px);
      }
    }

    .filter-reset {
      align-self: flex-start;
      padding: 2px 8px;
      background-color: transparent;
      border: 1px solid var(--color-text);
      font-size: var(--small-font-size);
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: var(--small-padding);

      &:hover {
        background-color: var(--color-text);
        color: var(--color-bg);
      }
    }
  }

  &__container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--big-margin);
  }

  &__items {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--big-margin);
  }

  &__load-more {
    display: flex;
    justify-content: center;
    margin-top: var(--mid-margin);

    .load-more-button {
      display: flex;
      align-items: center;
      gap: var(--small-padding);
      padding: var(--small-padding) var(--mid-padding);
      background-color: transparent;
      border: 1px solid var(--color-text);
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--color-text);
        color: var(--color-bg);
      }

      .plus-icon {
        font-size: 1.2rem;
        font-weight: bold;
      }
    }
  }
}

/* Grid-Item Styling */
.grid-item {
  display: flex;
  flex-direction: column;

  &__link {
    display: contents;
    text-decoration: none;
    color: inherit;
  }

  &__image {
    position: relative;
    overflow: hidden;

    img {
      width: 100%;
      height: auto;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    &:hover img {
      transform: scale(1.05);
    }
  }

  :deep(img) {
    @apply object-cover;
    @apply max-w-full w-100;
  }

  &__content {
    width: 100%;
    display: flex;
    flex-flow: column wrap;
    justify-content: flex-start;
    align-items: flex-start;
    margin: var(--mid-padding) 0 0 0;
    gap: var(--mid-padding);

    .grid-item__date {
      font-size: var(--small-font-size);
      text-transform: uppercase;
    }

    .grid-item__title {
      font-size: var(--base-font-size);
      text-transform: uppercase;
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

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--small-padding);

    &.city-tags {
      margin-bottom: var(--small-padding);
    }

    .tag {
      padding: 2px 8px;
      background-color: var(--color-text);
      color: var(--color-bg);
      font-size: var(--small-font-size);
      border: none;

      &.city {
        background-color: var(--color-secondary);
      }
    }
  }

  &__genres {
    display: flex;
    flex-wrap: wrap;
    gap: var(--small-padding);

    .genre {
      font-size: var(--small-font-size);
      color: var(--color-grey);
    }
  }

  .play-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: var(--color-text);
    color: var(--color-bg);
    border: none;
    cursor: pointer;
    transition: transform 0.2s ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
}

/* Style-spezifische Anpassungen */
.module-grid {
  &--cards {
    .grid-item {
      display: flex;
      flex-direction: column;

      :deep(img),
      :deep(.video-wrapper) {
        aspect-ratio: 3 / 4 !important;
      }

      &__content {
        flex-grow: 1;
        margin-top: var(--mid-padding);
      }

      h2,
      h3 {
        font-family: var(--font-text-semibold);
        font-weight: 550;
      }
    }
  }

  &--thumbnails {
    .grid-item {
      :deep(img),
      :deep(.video-wrapper) {
        aspect-ratio: 1 / 1 !important;
        object-fit: cover;
        @apply max-w-full;
      }

      &__content {
        gap: 0;
        flex-grow: 1;
        margin-top: var(--mid-padding);

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

            svg {
              height: var(--base-font-size);
              transform: translate(1px, 0);
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

  &--image {
    .grid-item {
      display: flex;
      flex-direction: row;

      :deep(img),
      :deep(.video-wrapper) {
        aspect-ratio: 3 / 1.5 !important;
        object-fit: cover;
        object-position: center;
        @apply max-w-full;
        width: 62.75%;
      }

      &__content {
        width: calc(100% - 62.75%);
        padding: var(--big-margin) 0 var(--big-margin) var(--big-margin);

        .grid-item__title {
          font-size: var(--large-font-size);
          text-transform: uppercase;
        }
      }
    }

    .content-grid__items {
      grid-template-columns: 1fr;
    }
  }

  &__title {
    @apply text-2xl font-bold mb-4;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--mid-margin);
  }
}

@media (max-width: 768px) {
  .content-grid {
    &__items {
      grid-template-columns: repeat(2, 1fr);
    }

    &__filters {
      .filter-subgenres {
        margin-left: 0;
      }
    }
  }

  .module-grid {
    &--image {
      .grid-item {
        flex-direction: column;

        :deep(img),
        :deep(.video-wrapper) {
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

@media (max-width: 480px) {
  .content-grid {
    &__items {
      grid-template-columns: 1fr;
    }
  }
}

.active-filters {
  margin-bottom: var(--mid-margin);
  padding: var(--small-padding) var(--mid-padding);
  border: 1px dashed var(--color-text);

  &__title {
    font-size: var(--small-font-size);
    font-family: var(--font-text-semibold);
    text-transform: uppercase;
    margin-bottom: var(--small-padding);
  }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: var(--small-padding);
  }

  .active-filter {
    display: flex;
    align-items: center;
    background-color: var(--color-text);
    color: var(--color-bg);
    padding: 2px 8px;
    font-size: var(--small-font-size);

    &__name {
      margin-right: 6px;
    }

    &__remove {
      background: none;
      border: none;
      color: var(--color-bg);
      font-size: 16px;
      line-height: 1;
      padding: 0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;

      &:hover {
        transform: scale(1.2);
      }
    }
  }
}
</style>