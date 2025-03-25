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
const currentIndex = ref(0);

const onSelect = (index: number) => {
  currentIndex.value = index;
};

// Sortierungs-Zustand
const sortMode = ref("new"); // Standardmäßig "new" (chronologisch)
const shuffleSeed = ref(Date.now()); // Zufallsseed für Shuffle

// Funktion zum Ändern des Sortiermodus
function changeSortMode(mode) {
  if (mode === "shuffle") {
    // Bei jedem Klick auf Shuffle einen neuen Seed generieren
    shuffleSeed.value = Date.now();
  }
  sortMode.value = mode;
}

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
    return "Elsewhere";
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
    // Bei additiver Filterung: Tag hinzufügen ohne vorherige in derselben Kategorie zu löschen
    // Zurücksetzen des "Others"-Status wenn ein Stadt-Filter aktiviert wird
    if (category === "city" && tagId === "others") {
      isOtherCitiesActive.value = true;
    }

    // Tag zur Kategorie und aktiven Filtern hinzufügen
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
      categoryType.value = "sets";
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

  // Gruppiere aktive Filter nach Kategorien
  const activeFiltersByCategory = {};

  // Initialisiere alle Kategorien
  Object.keys(filterCategories).forEach((category) => {
    activeFiltersByCategory[category] = new Set();
  });

  // Fülle die Kategorien mit den aktiven Filtern
  for (const filterId of activeFilters.value) {
    const category = getTagCategory(filterId);
    activeFiltersByCategory[category].add(filterId);
  }

  // Spezialbehandlung für "Others" Filter in der city-Kategorie
  if (activeFiltersByCategory.city.has("others")) {
    const cityTags = getItemCityTags(item);
    const isOthersMatch =
      cityTags.length === 0 || cityTags.every((tag) => !isMainCity(tag));

    // Wenn "others" der einzige city-Filter ist und es passt nicht, sofort false zurückgeben
    if (activeFiltersByCategory.city.size === 1 && !isOthersMatch) {
      return false;
    }

    // Wenn "others" mit anderen city-Filtern kombiniert wird und mindestens einer passt
    if (activeFiltersByCategory.city.size > 1) {
      let hasMatchingCityTag = isOthersMatch;

      // Prüfe, ob das Item einen der anderen city-Filter erfüllt
      for (const cityFilterId of activeFiltersByCategory.city) {
        if (cityFilterId !== "others") {
          // Prüfe direkte Tags
          if (item.tags && Array.isArray(item.tags)) {
            if (item.tags.some((tag) => tag._id === cityFilterId)) {
              hasMatchingCityTag = true;
              break;
            }
          }

          // Prüfe Tags aus parentShow
          if (
            !hasMatchingCityTag &&
            item.parentShow &&
            item.parentShow.tags &&
            Array.isArray(item.parentShow.tags)
          ) {
            if (item.parentShow.tags.some((tag) => tag._id === cityFilterId)) {
              hasMatchingCityTag = true;
              break;
            }
          }
        }
      }

      // Wenn keine der Stadt-Filter passt
      if (!hasMatchingCityTag) {
        return false;
      }
    }

    // Entferne "others" aus der Menge, damit es in der normalen Logik nicht berücksichtigt wird
    activeFiltersByCategory.city.delete("others");
  }

  // Prüfe für jede Kategorie mit aktiven Filtern
  for (const [category, filters] of Object.entries(activeFiltersByCategory)) {
    // Wenn keine Filter in dieser Kategorie, überspringen
    if (filters.size === 0) continue;

    // Für jede Kategorie muss mindestens ein Filter übereinstimmen (ODER-Beziehung innerhalb einer Kategorie)
    let hasCategoryMatch = false;

    for (const filterId of filters) {
      let hasMatchingTag = false;

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

      // Wenn ein Tag in dieser Kategorie übereinstimmt, ist die Kategorie erfüllt
      if (hasMatchingTag) {
        hasCategoryMatch = true;
        break;
      }
    }

    // Wenn keine Übereinstimmung in dieser Kategorie gefunden wurde
    if (!hasCategoryMatch && filters.size > 0) {
      return false;
    }
  }

  return true; // Alle Kategorie-Bedingungen sind erfüllt
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

// Berechne alle Items nach Typ und sortiere sie
const allItems = computed(() => {
  if (!props.module) return [];

  let items = [];

  switch (props.module.type) {
    case "pool":
      items = filterItems(
        props.module.poolItems || [],
        props.module.poolContentType
      );
      break;
    case "sets":
      items = props.module.setItems || [];
      break;
    case "shows":
      items = props.module.showItems || [];
      break;
    case "words":
      items = props.module.articleItems || [];
      break;
    default:
      items = [];
  }

  return items;
});

// Berechne die gefilterten und sortierten Items
const filteredItems = computed(() => {
  let filteredArray = allItems.value.filter((item) => itemMatchesFilters(item));

  // Sortierung anwenden
  if (sortMode.value === "new") {
    // Chronologisch sortieren (neuste zuerst)
    return filteredArray.sort((a, b) => {
      const dateA = new Date(a._updatedAt || a.datetime || a._createdAt || 0);
      const dateB = new Date(b._updatedAt || b.datetime || b._createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  } else if (sortMode.value === "shuffle") {
    // Shuffle mit stabilem Seed für die aktuelle Sitzung
    return shuffleArray([...filteredArray], shuffleSeed.value);
  } else if (sortMode.value === "alpha") {
    // Alphabetisch nach Titel sortieren
    return filteredArray.sort((a, b) => {
      // Bestimme den Titel je nach Content-Typ
      const titleA = (
        a.title ||
        a.name ||
        (a.parentShow ? a.parentShow.title : "")
      ).toLowerCase();
      const titleB = (
        b.title ||
        b.name ||
        (b.parentShow ? b.parentShow.title : "")
      ).toLowerCase();
      return titleA.localeCompare(titleB);
    });
  }

  return filteredArray;
});

// Fisher-Yates Shuffle-Algorithmus mit Seed
function shuffleArray(array, seed) {
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
function seededRandom(seed) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

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
  <ClientOnly>
    <div
      v-if="module"
      :class="`content-grid module-grid module-grid--${
        module.style || 'default'
      } ${categoryType.toLowerCase()}`"
    >
      <div class="module-grid__header">
        <!-- <div class="module-grid__header__left">
          <h3 v-if="module.title" class="module-grid__title">
            {{ module.title }}
          </h3>
          <section
            v-if="categoryType == 'sets'"
            class="module-grid__header__type"
          >
            <h2 class="module-grid__header__type__pill">Shows</h2>
          </section>
          <section v-else class="module-grid__header__type">
            <h2 class="module-grid__header__type__pill">{{ categoryType }}</h2>
          </section>
        </div> -->
      </div>

      <!-- Filter Panel -->
      <div class="content-grid__filter-bar">
        <div class="active-filters">
          <h4
            class="active-filters__title"
            :class="{ active: activeFilters.size > 0 }"
            @click="resetFilters()"
          >
            <span @click="resetFilters()" class="close-cross"
              ><svg
                width="10"
                height="10"
                viewBox="0 0 8 8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="4" cy="4" r="4" fill="black" />
                <rect
                  x="1.77783"
                  y="2.4082"
                  width="0.888889"
                  height="5.33333"
                  transform="rotate(-45 1.77783 2.4082)"
                  fill="#E8E8E8"
                />
                <path
                  d="M2.40625 6.17578L1.77771 5.54724L5.54895 1.77601L6.17749 2.40455L4.29187 4.29016L2.40625 6.17578Z"
                  fill="#E8E8E8"
                />
              </svg> </span
            >Tags
          </h4>
          <div class="active-filters__list tags">
            <div
              v-for="filterId in activeFilters"
              :key="filterId"
              class="active-filter tag"
            >
              <span class="active-filter__name" @click="toggleFilter(filterId)">
                {{ getTagNameById(filterId)
                }}<span @click="toggleFilter(filterId)" class="close-cross"
                  ><svg
                    width="10"
                    height="10"
                    viewBox="0 0 8 8"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    @click="toggleFilter(filterId)"
                  >
                    <circle cx="4" cy="4" r="4" fill="black" />
                    <rect
                      x="1.77783"
                      y="2.4082"
                      width="0.888889"
                      height="5.33333"
                      transform="rotate(-45 1.77783 2.4082)"
                      fill="#E8E8E8"
                    />
                    <path
                      d="M2.40625 6.17578L1.77771 5.54724L5.54895 1.77601L6.17749 2.40455L4.29187 4.29016L2.40625 6.17578Z"
                      fill="#E8E8E8"
                    />
                  </svg>
                </span>
              </span>
            </div>
          </div>
        </div>
        <!-- Cities-->
        <div
          v-if="categorizedTags.cities && categorizedTags.cities.length > 0"
          class="filter-cities tags"
        >
          <h4 class="filter-cities__title">City</h4>
          <div class="filter-tags">
            <!-- Hauptstädte anzeigen -->
            <button
              v-for="tag in categorizedTags.cities.filter((tag) =>
                isMainCity(tag)
              )"
              :key="tag._id"
              class="tag"
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
              class="tag"
              :class="[
                'filter-tag',
                'filter-tag--city',
                { 'filter-tag--active': isOtherCitiesActive },
              ]"
              @click="toggleFilter('others')"
            >
              Elsewhere
            </button>
          </div>
        </div>
        <!-- Sortierungsoptionen -->
        <div class="sort-options">
          <h4 class="sort-options__title">Sort</h4>

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

      <div
        v-if="allItems.length > 0 && module.availableTags"
        class="content-grid__filters"
      >
        <div class="filter-container tags">
          <!-- Filter für Sets mit verschachtelten Genres -->
          <template v-if="contentType === 'sets'">
            <!-- Genre mit Subgenres -->
            <div
              v-if="categorizedTags.genres && categorizedTags.genres.length > 0"
              class="filter-category tags"
            >
              <div class="filter-genres">
                <div
                  v-for="(genre, index) in categorizedTags.genres"
                  :key="genre._id"
                  class="filter-genre"
                >
                  <button
                    class="tag"
                    :class="[
                      'filter-tag',
                      'filter-tag--genre',
                      { 'filter-tag--active': index === currentIndex },
                    ]"
                    @click="toggleSubFilter(genre._id), onSelect(index)"
                  >
                    {{ genre.title }}
                  </button>
                </div>
              </div>

              <div class="filter-subgenres">
                <div
                  v-for="genre in categorizedTags.genres"
                  :key="genre._id"
                  class="filter-subgenre"
                  :class="{ hidden: activeSubFilters !== genre._id }"
                >
                  <!-- Subgenres -->
                  <div
                    v-if="
                      genre.subGenres &&
                      genre.subGenres.length > 0 &&
                      activeSubFilters == genre._id
                    "
                    class="filter-subgenre__tags"
                  >
                    <button
                      v-for="subGenre in genre.subGenres"
                      :key="subGenre._id"
                      class="tag"
                      :class="[
                        'filter-tag',
                        'filter-tag--subgenre',
                        {
                          'filter-tag--active': activeFilters.has(subGenre._id),
                        },
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
              <!-- Städte Tags wenn vorhanden -->
              <div class="grid-item__tags city-tags">
                <span
                  v-for="tag in getItemCityTags(item)"
                  :key="tag._id"
                  class="tag city"
                >
                  {{ parseI18nObj(tag?.short) }}
                </span>
              </div>
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
                <!-- Interaktiver Bereich mit Datum und Play-Button -->
                <section class="grid-item__content__interactive">
                  <!-- Datum (falls vorhanden) -->
                  <div
                    v-if="item.datetime || item.publishedAt"
                    class="grid-item__date"
                  >
                    {{ formatDate(item.datetime || item.publishedAt) }}
                  </div>

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
                </section>
                <div v-if="item.parentShow && contentType == 'sets'">
                  <!-- Show-Titel (für Sets) -->
                  <h3 class="grid-item__title show-title">
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
                      class="grid-item__artist"
                    >
                      {{ artist.title
                      }}{{ index < item.persons.length - 1 ? ", " : "" }}
                    </h3>
                  </div>
                </div>

                <!-- Titel für alle anderen Content-Typen -->
                <h3 v-if="contentType !== 'sets'" class="grid-item__title">
                  {{ item.title || item.name }}
                </h3>

                <!-- Nicht-City Tags anzeigen -->
                <div
                  v-if="getItemNonCityTags(item).length > 0"
                  class="grid-item__tags tags"
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
  </ClientOnly>
</template>
<style lang="postcss" scoped>
.content-grid {
  @apply overflow-hidden;
  max-width: clamp(100%, 100%, var(--page-max-width));

  &.shows,
  &.sets {
    .filter-tag--city {
      background-color: var(--color-pink);
    }
  }

  &.words {
    .filter-tag--city {
      background-color: var(--color-green);
    }
  }

  &.pool {
    .filter-tag--city {
      background-color: var(--color-green);
    }
  }

  &__no-results {
    padding: var(--mid-padding);
    text-align: center;
    margin-bottom: var(--mid-margin);
  }

  &__filter-bar {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    padding: var(--small-padding) 0;
    background-color: var(--color-text);
    border-radius: 100px;
    @media (prefers-color-scheme: dark) {
      background-color: var(--color-dark-grey);
    }
    .active-filters {
      width: calc(33% - var(--big-margin) / 2 + (var(--mid-margin) / 2));
    }
    .sort-options {
      width: calc(33% - var(--big-margin) / 2 + (var(--mid-margin) / 2));
    }
    .filter-cities {
      width: calc(33% + var(--big-margin) / 2 + (var(--mid-margin) / 2));
    }
    .active-filters {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--small-padding);
      padding: 0 0 0 var(--mid-margin);
      border-right: 1px solid var(--color-grey);
      overflow-x: scroll;
      &__title {
        display: flex;
        flex-flow: row wrap;
        align-items: center;
        justify-content: center;
        font-size: var(--small-font-size);
        font-family: var(--font-text-semibold);
        text-transform: uppercase;
        color: var(--color-bg);
        &.active {
          cursor: pointer;
          color: var(--color-pink);
          .close-cross {
            display: block;
          }
        }
        .close-cross {
          display: none;
          position: absolute;
          transform: translate(calc(-100% - 12px), -0.5px);
          margin: 0 0 0 0;
          filter: invert(1);
        }
      }

      &__list {
        display: flex;
        flex-flow: row nowrap;
        justify-content: flex-start;
        align-items: center;
        overflow: scroll;
        gap: 0 var(--small-padding);
        position: relative;
        &::-webkit-scrollbar {
          display: none;
        }
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .active-filter {
        background-color: var(--color-grey);
        color: var(--color-dark-grey);
        font-size: var(--small-font-size);
        position: relative;
        min-width: max-content;
        &::-webkit-scrollbar {
          display: none;
        }
        -ms-overflow-style: none;
        scrollbar-width: none;
        .close-cross {
          transform: translate(0, -1px);
          right: 6px;
          position: absolute;
        }

        &__name {
          min-width: max-content;
          cursor: pointer;
          font-size: var(--small-font-size);
          padding: 0 8px 0 0;
        }
      }
    }
    .filter-cities {
      display: flex;
      flex-flow: row nowrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--small-padding);
      padding: 0 calc(var(--mid-margin) / 2);

      &__title {
        font-size: var(--small-font-size);
        font-family: var(--font-text-semibold);
        text-transform: uppercase;
        color: var(--color-bg);
      }

      .filter-tags {
        display: flex;
        flex-flow: row nowrap;
        overflow-x: visible;
        justify-content: flex-start;
        align-items: center;
        gap: 0 var(--small-padding);
        .filter-tag {
          background-color: var(--color-dark-grey);
          color: var(--color-text);
          @media (prefers-color-scheme: dark) {
            background-color: var(--color-dark-grey);
          }

          &.filter-tag--active,
          &:hover {
            background-color: var(--color-pink);
            color: var(--color-bg);
            @media (prefers-color-scheme: dark) {
              border-color: var(--color-pink);
            }
          }
        }
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

        &:hover .filter-category__title {
          text-decoration: underline;
        }
      }
    }
    .sort-options {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--mid-margin);
      padding: 0 var(--mid-margin) 0 calc(var(--mid-margin) / 2);
      border-left: 1px solid var(--color-grey);
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
        font-size: var(--small-font-size);
        color: var(--color-dark-grey);
        text-transform: uppercase;
        font-family: var(--font-text-semibold);
        @media (prefers-color-scheme: dark) {
          color: var(--color-bg);
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: var(--color-dark-grey);
          transform: translate(0%, 0%);
          @media (prefers-color-scheme: dark) {
            background-color: var(--color-bg);
          }
        }
        &:hover {
          color: var(--color-pink);
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

  &__filters {
    margin-bottom: var(--mid-margin);

    .filter-tag--city {
      background-color: var(--color-pink);
      color: var(--color-bg);

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
      }
    }

    .filter-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--small-padding);
    }

    .filter-genres {
      display: flex;
      flex-flow: row wrap;
      align-items: center;
      justify-content: center;
      margin: var(--base-padding) auto;
      max-width: 66%;
      width: 66%;
      gap: var(--small-padding);
      .filter-genre {
        display: flex;
        flex-flow: row wrap;
        gap: calc(var(--small-padding) / 2);
      }
    }

    .filter-subgenres {
      margin-left: var(--mid-padding);
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-items: center;
      gap: var(--small-padding);
      .filter-subgenre {
        width: 100%;
        display: flex;
        flex-flow: row wrap;
        justify-content: center;
        align-items: center;
        gap: calc(var(--small-padding) / 2);
        &.hidden {
          display: none;
        }
        .filter-subgenre__tags {
          display: flex;
          flex-flow: row wrap;
          justify-content: center;
          align-items: center;
          gap: calc(var(--small-padding) / 2);
        }
      }
    }

    .filter-tag {
      font-size: var(--small-font-size);
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: var(--color-bg);
      color: var(--color-text);

      &:hover,
      &--active {
        background-color: var(--color-text);
        color: var(--color-bg);
      }

      &--genre {
      }

      &--subgenre {
        font-size: calc(var(--small-font-size));
      }
    }

    .filter-reset {
      align-self: flex-start;
      padding: 2px 8px;
      background-color: transparent;
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
    min-width: calc(var(--page-max-width) + var(--big-margin));
    margin: 0 0 0 calc(var(--big-margin) * -0.5);
    display: flex;
    flex-direction: column;
  }

  &__items {
    width: 100%;
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: stretch;
    padding: 0 calc(var(--big-margin) / 2);
    gap: calc(var(--big-margin) / 2) calc(var(--big-margin) * 1.9875);
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
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--color-text);
        color: var(--color-bg);
      }

      .plus-icon {
        font-size: 1.2rem;
      }
    }
  }
}

/* Grid-Item Styling */
.grid-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  max-width: calc(100% / 3 - var(--big-margin) * 1.325);
  width: 100%;
  border-bottom: 0.09325rem solid var(--color-text);
  padding: 0 0 calc(var(--big-margin) / 2) 0;

  &:last-of-type {
    justify-self: flex-start;
    margin: 0 auto 0 0;
  }

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
      aspect-ratio: 1 / 1 !important;
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
    align-items: stretch;
    flex-grow: 1;
    margin: var(--mid-padding) 0 0 0;
    gap: var(--mid-padding);

    .grid-item__tags {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: flex-end;
      gap: var(--small-margin);
      flex-grow: 1;
    }

    &__interactive {
      width: 100%;
      display: flex;
      flex-flow: row wrap;
      justify-content: space-between;
      align-items: center;

      .grid-item__date {
        font-size: var(--small-font-size);
        text-transform: uppercase;
      }

      .play-button {
        display: flex;
        flex-flow: row;
        justify-content: center;
        align-items: center;
        margin: 0 0 0 auto;
        color: transparent;
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

    .grid-item__title {
      font-size: var(--base-font-size);
      text-transform: uppercase;
      font-family: var(--font-text-semibold);
      margin: 0;
    }

    .grid-item__artist {
      font-size: var(--base-font-size);
      text-transform: uppercase;
      font-family: var(--font-text-semibold);
      margin: 0;
    }

    .show-title {
    }

    .show-artists {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      margin-bottom: var(--mid-padding);
    }
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
</style>