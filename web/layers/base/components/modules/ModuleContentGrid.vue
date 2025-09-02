<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
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

// Filter-Zustand
const activeFilters = ref(new Set());
const activeSubFilters = ref(false);
const mainCities = ["Düsseldorf", "Leipzig", "Vienna"]; // Hauptstädte definieren
const isOtherCitiesActive = ref(false); // Zustand für "Others"-Filter
const currentIndex = ref(false);
const showFilters = ref(true); // Zustand für Filter-Sichtbarkeit
const lastScrollY = ref(0); // Letzte Scroll-Position
const scrollThreshold = 30; // Scroll-Schwellenwert in Pixeln (reduziert für früheres Ausblenden)
const moduleContainer = ref(null); // Template-Referenz für das Modul-Container

// Genre-Filter-Zustand (separate Logik)
const activeGenre = ref(null); // Aktuell ausgewähltes Genre
const activeSubGenres = ref(new Set()); // Ausgewählte SubGenres

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

  // Suche in allen verfügbaren Tags (für "Pool Tags")
  const otherTag = availableTags.value.find((tag) => tag._id === tagId);
  if (otherTag) return otherTag.title;

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

// Content-Typ-spezifische Tags nach Kategorien (für Nicht-Set-Inhaltstypen)
const poolTags = computed(() => {
  if (!availableTags.value) return { musicians: [], venues: [], crafts: [] };

  // Sammle die verwendeten Tag-IDs für alle Dokumente nach Typ
  const musicianTagIds = new Set();
  const venueTagIds = new Set();
  const craftsTagIds = new Set();

  // Filtere die Items nach Typ und sammle die Tags
  allItems.value.forEach((item) => {
    if (item._type === "person") {
      // Person-Tags nach Musiker/Handwerker filtern
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag) => {
          if (tag._type === "tag.musician") {
            musicianTagIds.add(tag._id);
          } else if (tag._type === "tag.crafts") {
            craftsTagIds.add(tag._id);
          }
        });
      }
    } else if (item._type === "venue") {
      // Venue-Tags sammeln
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach((tag) => {
          if (tag._type === "tag.venue") {
            venueTagIds.add(tag._id);
          }
        });
      }
    }
  });

  // Filtere die verfügbaren Tags nach Typ und ob sie verwendet werden
  const musicians = availableTags.value.filter(
    (tag) => tag._type === "tag.musician" && musicianTagIds.has(tag._id)
  );

  const venues = availableTags.value.filter(
    (tag) => tag._type === "tag.venue" && venueTagIds.has(tag._id)
  );

  const crafts = availableTags.value.filter(
    (tag) => tag._type === "tag.crafts" && craftsTagIds.has(tag._id)
  );

  return {
    musicians,
    venues,
    crafts,
  };
});

// Aktivierter Typ für die Filterung
const activeFilterType = ref(null);

// Toggle für Filtertyp
function toggleFilterType(type) {
  activeFilterType.value = activeFilterType.value === type ? null : type;
}

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
    
    // Wenn es ein SubGenre ist, auch aus activeSubGenres entfernen
    if (category === "subGenre") {
      activeSubGenres.value.delete(tagId);
    }

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

// Genre-Filter-Funktionen
function toggleGenreFilter(genreId) {
  if (activeGenre.value === genreId) {
    // Genre deaktivieren
    activeGenre.value = null;
    // Alle SubGenres aus aktiven Filtern entfernen
    for (const subGenreId of activeSubGenres.value) {
      activeFilters.value.delete(subGenreId);
    }
    activeSubGenres.value.clear();
  } else {
    // Vorherige SubGenres aus aktiven Filtern entfernen
    for (const subGenreId of activeSubGenres.value) {
      activeFilters.value.delete(subGenreId);
    }
    // Neues Genre aktivieren
    activeGenre.value = genreId;
    activeSubGenres.value.clear();
  }
  
  // Aktualisiere gefilterte Items
  visibleItemCount.value = itemsPerPage;
}

function toggleSubGenreFilter(subGenreId) {
  if (activeSubGenres.value.has(subGenreId)) {
    activeSubGenres.value.delete(subGenreId);
    // Auch aus den normalen aktiven Filtern entfernen
    activeFilters.value.delete(subGenreId);
  } else {
    activeSubGenres.value.add(subGenreId);
    // Auch zu den normalen aktiven Filtern hinzufügen (für die Filter-Bar)
    activeFilters.value.add(subGenreId);
  }
  
  // Aktualisiere gefilterte Items
  visibleItemCount.value = itemsPerPage;
}

// Toggle Filter-Sichtbarkeit
function toggleFiltersVisibility() {
  showFilters.value = !showFilters.value;
}

// Scroll-Handler für automatisches Ein-/Ausblenden der Filter
function handleScroll(event: Event) {
  const scrollContainer = event.target as HTMLElement;
  const currentScrollY = scrollContainer.scrollTop;
  const scrollDifference = currentScrollY - lastScrollY.value;

  // Wenn nach unten gescrollt wird und der Schwellenwert überschritten wird
  if (scrollDifference > scrollThreshold && showFilters.value) {
    showFilters.value = false;
  }
  // Filter nur wieder einblenden, wenn man fast ganz oben ist (weniger als 50px vom Anfang)
  else if (currentScrollY < 50 && !showFilters.value) {
    showFilters.value = true;
  }

  lastScrollY.value = currentScrollY;
}

// Zurücksetzen aller Filter
function resetFilters() {
  activeFilters.value.clear();
  Object.values(filterCategories).forEach((categorySet) => categorySet.clear());
  isOtherCitiesActive.value = false;
  
  // Genre-Filter auch zurücksetzen
  activeGenre.value = null;
  activeSubGenres.value.clear();
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
  let image = null;

  // Bild aus dem Item selbst
  if (item.image || item.mainImage) {
    image = item.image || item.mainImage;
  } else {
    // Fallback-Bilder je nach Typ
    switch (itemType) {
      case "person":
        image = mainStore?.siteFallbacks?.fallbackPerson?.image;
        break;
      case "venue":
        image = mainStore?.siteFallbacks?.fallbackVenue?.image;
        break;
      case "show":
        image = mainStore?.siteFallbacks?.fallbackShow?.image;
        break;
      case "set":
        image = mainStore?.siteFallbacks?.fallbackSet?.image;
        break;
      case "word":
      case "article":
        image = mainStore?.siteFallbacks?.fallbackArticle?.image;
        break;
      default:
        // Allgemeines Fallback-Bild
        image = mainStore?.siteFallbacks?.fallbackPerson?.image;
    }
  }

  return image;
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
      item.parentShow?.tags &&
      Array.isArray(item.parentShow?.tags)
    ) {
      item.parentShow?.tags.forEach((tag) => {
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
    item.parentShow?.tags &&
    Array.isArray(item.parentShow?.tags)
  ) {
    if (item.parentShow?.tags.some((tag) => tag._type === "tag.city")) {
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
    item.parentShow?.tags &&
    Array.isArray(item.parentShow?.tags)
  ) {
    item.parentShow?.tags.forEach((tag) => {
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

// Prüft, ob ein Item den aktiven Filtern entspricht
function itemMatchesFilters(item) {
  // Genre-Filter prüfen (hat Vorrang vor normalen Filtern)
  if (activeGenre.value) {
    // Wenn SubGenres ausgewählt sind, nur diese anzeigen (substraktiv)
    if (activeSubGenres.value.size > 0) {
      let hasAllSubGenres = true;
      
      for (const subGenreId of activeSubGenres.value) {
        let hasSubGenre = false;
        
        // Prüfe direkte Tags
        if (item.tags && Array.isArray(item.tags)) {
          if (item.tags.some((tag) => tag._id === subGenreId)) {
            hasSubGenre = true;
          }
        }
        
        // Prüfe Tags aus parentShow
        if (!hasSubGenre && item.parentShow && item.parentShow?.tags && Array.isArray(item.parentShow?.tags)) {
          if (item.parentShow?.tags.some((tag) => tag._id === subGenreId)) {
            hasSubGenre = true;
          }
        }
        
        if (!hasSubGenre) {
          hasAllSubGenres = false;
          break;
        }
      }
      
      if (!hasAllSubGenres) {
        return false;
      }
    } else {
      // Nur Genre ausgewählt - zeige alle Items mit diesem Genre oder seinen SubGenres (additiv)
      let hasGenreOrSubGenre = false;
      
      // Hole das Genre-Objekt und alle seine SubGenres
      const genreObj = categorizedTags.value.genres.find(g => g._id === activeGenre.value);
      if (genreObj) {
        const allGenreIds = [genreObj._id];
        if (genreObj.subGenres) {
          allGenreIds.push(...genreObj.subGenres.map(sg => sg._id));
        }
        
        // Prüfe direkte Tags
        if (item.tags && Array.isArray(item.tags)) {
          if (item.tags.some((tag) => allGenreIds.includes(tag._id))) {
            hasGenreOrSubGenre = true;
          }
        }
        
        // Prüfe Tags aus parentShow
        if (!hasGenreOrSubGenre && item.parentShow && item.parentShow?.tags && Array.isArray(item.parentShow?.tags)) {
          if (item.parentShow?.tags.some((tag) => allGenreIds.includes(tag._id))) {
            hasGenreOrSubGenre = true;
          }
        }
      }
      
      if (!hasGenreOrSubGenre) {
        return false;
      }
    }
  }
  
  // Normale Filter prüfen (substraktiv wie bisher)
  if (activeFilters.value.size === 0) {
    return true; // Keine normalen Filter aktiv
  }

  // Alle aktiven normalen Filter müssen erfüllt sein (UND-Verknüpfung)
  for (const filterId of activeFilters.value) {
    let hasMatchingTag = false;

    // Spezialbehandlung für "Others" Filter
    if (filterId === "others") {
      const cityTags = getItemCityTags(item);
      const isOthersMatch = cityTags.length === 0 || cityTags.every((tag) => !isMainCity(tag));
      if (isOthersMatch) {
        hasMatchingTag = true;
      }
    } else {
      // Prüfe direkte Tags
      if (item.tags && Array.isArray(item.tags)) {
        if (item.tags.some((tag) => tag._id === filterId)) {
          hasMatchingTag = true;
        }
      }

      // Prüfe Tags aus parentShow (falls noch nicht gefunden)
      if (
        !hasMatchingTag &&
        item.parentShow &&
        item.parentShow?.tags &&
        Array.isArray(item.parentShow?.tags)
      ) {
        if (item.parentShow?.tags.some((tag) => tag._id === filterId)) {
          hasMatchingTag = true;
        }
      }
    }

    // Wenn dieser normale Filter nicht erfüllt ist, Item ausschließen
    if (!hasMatchingTag) {
      return false;
    }
  }

  // Alle Filter sind erfüllt
  return true;
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

// Referenz für das Scroll-Container Element
const scrollContainer = ref<HTMLElement | null>(null);

onMounted(() => {
  if (contentType.value === "sets") {
    allItems.value.forEach((item) => {
      loadArtworkUrl(item);
    });
  }

  // Finde das erste div nach main Element
  const mainElement = document.querySelector('main');
  if (mainElement && mainElement.firstElementChild instanceof HTMLElement) {
    scrollContainer.value = mainElement.firstElementChild;
    lastScrollY.value = scrollContainer.value.scrollTop;
    scrollContainer.value.addEventListener("scroll", handleScroll, { passive: true });
  }
});

onUnmounted(() => {
  // Scroll-Listener entfernen
  if (scrollContainer.value) {
    scrollContainer.value.removeEventListener("scroll", handleScroll);
  }
});
</script>
<template>
  <ClientOnly>
    <div
      v-if="module"
      ref="moduleContainer"
      :class="`content-grid module-grid module-grid--${
        module.style || 'default'
      } ${categoryType.toLowerCase()}`"
    >
      <!-- <div class="module-grid__header">
        <div class="module-grid__header__left">
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
        </div>
      </div> -->

      <!-- Filter Panel -->
      <div class="content-grid__filter-section">
        <div class="content-grid__filter-bar">
          <div class="active-filters">
            <h4
              class="active-filters__title"
              :class="{ active: activeFilters.size > 0 }"
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
                </svg>
              </span>
              <span @click="toggleFiltersVisibility">
                Tags&nbsp;<span class="toggle-arrow">{{
                  showFilters ? "↑" : "↓"
                }}</span>
              </span>
            </h4>
            <div class="active-filters__list tags">
              <div
                v-for="filterId in activeFilters"
                :key="filterId"
                class="active-filter tag"
              >
                <span
                  class="active-filter__name"
                  @click="toggleFilter(filterId)"
                >
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
                v-if="
                  categorizedTags.genres && categorizedTags.genres.length > 0
                "
                class="filter-category tags"
                :class="{
                  active: showFilters,
                }"
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
                        { 'filter-tag--active': activeGenre === genre._id },
                      ]"
                      @click="toggleGenreFilter(genre._id)"
                    >
                      {{ genre.title }}
                    </button>
                  </div>
                </div>

                <div class="filter-subgenres">
                  <div
                    v-if="activeGenre && categorizedTags.genres.find(g => g._id === activeGenre)?.subGenres?.length > 0"
                    class="filter-subgenre"
                  >
                    <!-- Subgenres -->
                    <div class="filter-subgenre__tags">
                      <button
                        v-for="subGenre in categorizedTags.genres.find(g => g._id === activeGenre)?.subGenres"
                        :key="subGenre._id"
                        class="tag"
                        :class="[
                          'filter-tag',
                          'filter-tag--subgenre',
                          {
                            'filter-tag--active': activeSubGenres.has(subGenre._id),
                          },
                        ]"
                        @click="toggleSubGenreFilter(subGenre._id)"
                      >
                        {{ subGenre.title }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- Filter für Pool -->
            <template v-else>
              <div
                v-if="getContentTypeSpecificTags.length > 0"
                class="filter-category tags"
              >
                <!-- Filtertypen (Musician, Venue, Crafts) -->
                <div class="filter-types tags">
                  <button
                    v-if="poolTags.musicians.length > 0"
                    :class="[
                      'filter-type tag',
                      {
                        'filter-type--active': activeFilterType === 'musicians',
                      },
                    ]"
                    @click="toggleFilterType('musicians')"
                  >
                    Musicians
                  </button>
                  <button
                    v-if="poolTags.venues.length > 0"
                    :class="[
                      'filter-type tag',
                      { 'filter-type--active': activeFilterType === 'venues' },
                    ]"
                    @click="toggleFilterType('venues')"
                  >
                    Venues
                  </button>
                  <button
                    v-if="poolTags.crafts.length > 0"
                    :class="[
                      'filter-type tag',
                      { 'filter-type--active': activeFilterType === 'crafts' },
                    ]"
                    @click="toggleFilterType('crafts')"
                  >
                    Crafts
                  </button>
                </div>

                <!-- Musician Tags -->
                <div
                  v-if="
                    activeFilterType === 'musicians' &&
                    poolTags.musicians.length > 0
                  "
                  class="filter-tags tags"
                >
                  <button
                    v-for="tag in poolTags.musicians"
                    :key="tag._id"
                    :class="[
                      'filter-tag tag',
                      { 'filter-tag--active': activeFilters.has(tag._id) },
                    ]"
                    @click="toggleFilter(tag._id)"
                  >
                    {{ tag.title }}
                  </button>
                </div>

                <!-- Venue Tags -->
                <div
                  v-if="
                    activeFilterType === 'venues' && poolTags.venues.length > 0
                  "
                  class="filter-tags tags"
                >
                  <button
                    v-for="tag in poolTags.venues"
                    :key="tag._id"
                    :class="[
                      'filter-tag tag',
                      { 'filter-tag--active': activeFilters.has(tag._id) },
                    ]"
                    @click="toggleFilter(tag._id)"
                  >
                    {{ tag.title }}
                  </button>
                </div>

                <!-- Crafts Tags -->
                <div
                  v-if="
                    activeFilterType === 'crafts' && poolTags.crafts.length > 0
                  "
                  class="filter-tags tags"
                >
                  <button
                    v-for="tag in poolTags.crafts"
                    :key="tag._id"
                    :class="[
                      'filter-tag tag',
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
      </div>

      <div class="content-grid__container">
        <div v-if="visibleItems.length > 0" class="content-grid__items">
          <div
            v-for="item in visibleItems"
            :key="item._id"
            :class="`grid-item grid-item--${module.style || 'default'}`"
          >
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
            <!-- Bild -->
            <NuxtLink
              v-if="item?.slug"
              :to="getItemRoute(item)"
              class="grid-item__link"
            >
              <div class="grid-item__image" v-if="contentType == 'sets'">
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
              <div class="grid-item__image" v-if="contentType !== 'sets'">
                <img
                  v-if="getItemImage(item)"
                  :src="getItemImage(item).asset?.url"
                  :alt="item.title || ''"
                />
                <img
                  v-else-if="
                    contentType === 'sets' && artworkUrls.get(item._id)
                  "
                  :src="artworkUrls.get(item._id)"
                  alt="Track Artwork"
                  class="track-artwork"
                />
                <div
                  v-else-if="contentType === 'sets'"
                  class="track-artwork-placeholder"
                  @vue:mounted="loadArtworkUrl(item)"
                ></div>
                <img
                  v-else
                  :src="
                    mainStore?.siteFallbacks?.fallbackSet?.image?.asset?.url
                  "
                  alt="Fallback Image"
                />
              </div>
            </NuxtLink>

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
                <NuxtLink
                  v-if="item.parentShow?.title !== 'No Show' && item.parentShow"
                  :to="
                    localePath(
                      `/shows/no-show/${item.parentShow?.slug.current}`
                    )
                  "
                  class="grid-item__link"
                >
                  <h3
                    class="grid-item__title show-title"
                    v-if="item.parentShow?.title !== 'No Show'"
                  >
                    {{ item.parentShow?.title }}
                  </h3>
                </NuxtLink>
                <h3
                  class="grid-item__title show-title"
                  v-else-if="item.parentShow?.title !== 'No Show'"
                >
                  {{ item.parentShow?.title }}
                </h3>
                <h3
                  class="grid-item__title show-title"
                  v-else-if="item.parentShow?.title == 'No Show' && item?.title"
                >
                  {{ item?.title }}
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
                    <NuxtLink
                      v-if="artist?.poolVisibility"
                      :to="localePath(`/pool/${artist?.slug?.current}`)"
                      class="grid-item__link"
                    >
                      {{ artist.title
                      }}{{ index < item.persons.length - 1 ? "," : "" }}&nbsp;
                    </NuxtLink>
                    <span v-else>
                      {{ artist.title
                      }}{{ index < item.persons.length - 1 ? "," : "" }}&nbsp;
                    </span>
                  </h3>
                </div>
              </div>

              <!-- Read more für Words -->

              <div v-if="contentType == 'words'" class="tags read-more">
                <NuxtLink :to="getItemRoute(item)" class="grid-item__link">
                  <h3 class="tag">Read More</h3>
                </NuxtLink>
              </div>
              <!-- Titel für alle anderen Content-Typen -->
              <NuxtLink :to="getItemRoute(item)" class="grid-item__link">
                <h3 v-if="contentType !== 'sets'" class="grid-item__title">
                  {{ item.title || item.name }}
                </h3>
              </NuxtLink>

              <!-- Hier die Teaser-Text Logik einfügen, analog zum ContentSlider -->
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
                  module.poolContentType == 'venues' &&
                  mainStore?.siteFallbacks?.fallbackVenue?.description.length >
                    0 &&
                  (mainStore?.siteFallbacks?.fallbackVenue?.description?.[0]
                    ?.value ||
                    mainStore?.siteFallbacks?.fallbackVenue?.description?.[1]
                      ?.value)
                "
                :blocks="
                  limitTextBlocks(
                    parseI18nObj(
                      mainStore?.siteFallbacks?.fallbackVenue?.description
                    )?.slice(0, 1),
                    100
                  )
                "
              />

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
          </div>
        </div>
        <div v-else class="content-grid__no-results">No matching content.</div>

        <div v-if="hasMoreItems" class="content-grid__load-more">
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
    </div>
  </ClientOnly>
</template>
<style lang="postcss" scoped>
.content-grid {
  position: relative;
  max-width: clamp(100%, 100%, var(--page-max-width));
  width: 100%;

  &.shows,
  &.sets {
    .active-filters {
      &__title {
        height: var(--small-font-size);
        cursor: pointer;
        &.active {
          color: var(--color-pink);
        }
        .toggle-arrow {
          position: absolute;
          font-size: var(--small-font-size);
          transform: translate(0,-1px);
        }
      }
    }
    .filter-cities {
      .filter-tags {
        .filter-tag {
          &.filter-tag--active {
            background-color: var(--color-pink);
            color: var(--color-bg);
          }
          &:hover {
            @media (min-width: 1024px) {
              background-color: var(--color-pink);
              color: var(--color-bg);
            }
          }
        }
      }
    }
    .sort-options {
      button {
        &.active {
          &:hover {
            @media (min-width: 1024px) {
              color: var(--color-pink);
            }
          }
          color: var(--color-pink);
          .dot {
            background-color: var(--color-pink);
          }
        }
      }
    }
    .filter-toggle {
      &__button:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-pink);
          color: var(--color-bg);
        }
      }
    }
  }

  &.words {
    .active-filters {
      &__title {
        &.active {
          color: var(--color-green);
        }
      }
    }
    .filter-cities {
      .filter-tags {
        .filter-tag {
          &.filter-tag--active {
            background-color: var(--color-green);
            color: var(--color-bg);
          }
          &:hover {
            @media (min-width: 1024px) {
              background-color: var(--color-green);
              color: var(--color-bg);
            }
          }
        }
      }
    }
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
    .filter-toggle {
      &__button:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-green);
          color: var(--color-bg);
        }
      }
    }
  }

  &.pool {
    .active-filters {
      &__title {
        &.active {
          color: var(--color-blue);
        }
      }
    }
    .filter-cities {
      .filter-tags {
        .filter-tag {
          &.filter-tag--active {
            background-color: var(--color-blue);
            color: var(--color-bg);
          }
          &:hover {
            @media (min-width: 1024px) {
              background-color: var(--color-blue);
              color: var(--color-bg);
            }
          }
        }
      }
    }
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
    .filter-toggle {
      &__button:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-blue);
          color: var(--color-bg);
        }
      }
    }
  }

  &__no-results {
    padding: var(--mid-padding);
    text-align: center;
    margin-bottom: var(--mid-margin);
  }

  &__filter-section {
    position: sticky;
    top: var(--base-margin);
    z-index: 9999;
    &::before {
      content: "";
      position: absolute;
      top: calc(var(--base-margin) * -1);
      left: calc(var(--big-margin) * -1);
      height: var(--big-margin);
      background-color: var(--color-bg);
      backdrop-filter: blur(10px);
      z-index: -1;
      width: calc(var(--page-max-width) + var(--big-margin) * 2);
    }
  }

  &__filter-bar {
    position: relative;
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    padding: var(--small-padding) 0;
    background-color: var(--color-text);
    border-radius: 100px;
    z-index: 50;
    .active-filters {
      width: calc(33% - var(--big-margin) / 2 + (var(--mid-margin) / 2) - 1px);
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
      &::-webkit-scrollbar {
        display: none;
      }
      -ms-overflow-style: none;
      scrollbar-width: none;
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
          @media (min-width: 1024px) {
            text-decoration: underline;
          }
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

  .filter-toggle {
    position: absolute;
    top: calc(var(--small-padding) * 1.25);
    width: max-content;
    transform: translate(calc(-100% + var(--base-padding)), 0);
    display: flex;
    justify-content: center;

    &__button {
      background-color: var(--color-text);
      color: var(--color-bg);
      border: none;
      padding: var(--small-padding) calc(var(--base-padding) * 2)
        var(--small-padding) var(--base-padding);
      border-bottom-left-radius: 100px;
      border-top-left-radius: 100px;

      cursor: pointer;
      font-size: var(--small-font-size);
      font-family: var(--font-text-semibold);
      text-transform: uppercase;
      transition: all 0.2s ease;

      &:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-grey);
        }
      }
    }
  }

  &__filters {
    margin-bottom: var(--big-margin);

    .filter-tag--city {
      background-color: var(--color-pink);
      color: var(--color-bg);

      &:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-secondary);
        }
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
      width: var(--page-max-width);
      position: absolute;
      background-color: var(--color-bg-transparent);
      transform: translate(0, calc(var(--mid-padding) * -1.75));
      padding: calc(var(--mid-padding) * 1.75) 0 var(--mid-padding);
      backdrop-filter: blur(10px);
      border-bottom-right-radius: 1.56125rem;
      border-bottom-left-radius: 1.56125rem;
      border: 1px solid var(--color-bg);
      z-index: 1;
      transition: all 0.3s ease;
      opacity: 0;
      &.active {
        opacity: 1;
      }
    }

    .filter-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--small-padding);
      cursor: pointer !important;
    }

    .filter-genres {
      display: flex;
      flex-flow: row wrap;
      align-items: center;
      justify-content: center;
      margin: var(--base-padding) auto var(--mid-padding);
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
        gap: var(--small-padding);
        &.hidden {
          display: none;
        }
        .filter-subgenre__tags {
          display: flex;
          flex-flow: row wrap;
          justify-content: center;
          align-items: center;
          gap: var(--small-padding);
        }
      }
    }

    .filter-types {
      display: flex;
      flex-flow: row wrap;
      align-items: center;
      justify-content: center;
      margin: var(--base-padding) auto;
      max-width: 66%;
      width: 66%;
      gap: var(--small-padding);
      .filter-type {
        display: flex;
        flex-flow: row wrap;
        gap: calc(var(--small-padding) / 2);
        background-color: var(--color-bg);
        color: var(--color-text);
        &--active {
          background-color: var(--color-text);
          color: var(--color-bg);
        }
      }
    }

    .filter-tags {
      width: 100%;
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-items: center;
      gap: var(--small-padding);
      &.hidden {
        display: none;
      }
      .filter-subgenre__tags {
        display: flex;
        flex-flow: row wrap;
        justify-content: center;
        align-items: center;
        gap: var(--small-padding);
      }
    }

    .filter-tag {
      font-size: var(--small-font-size);
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: var(--color-bg);
      /* background-color: var(--color-bg-transparent);
      backdrop-filter: blur(10px); */
      color: var(--color-text);

      &:hover {
        @media (min-width: 1024px) {
          background-color: var(--color-text);
          color: var(--color-bg);
        }
      }
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
        @media (min-width: 1024px) {
          background-color: var(--color-text);
          color: var(--color-bg);
        }
      }
    }
  }

  &__container {
    min-width: calc(var(--page-max-width) + var(--big-margin));
    margin: calc(var(--big-margin) * 2) 0 0 calc(var(--big-margin) * -0.5);
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
    justify-content: flex-end;
    margin-top: var(--mid-margin);

    .load-more-button {
      display: flex;
      align-items: center;
      gap: var(--small-padding);
      padding: var(--small-padding) var(--big-padding);
      margin: 0 calc(var(--big-margin) / 2 + 0.6rem) 0.6rem 0;
      background-color: transparent;
      cursor: pointer;
      transition: all 0.2s ease;
      font-family: var(--font-text-semibold);
      background-color: var(--color-bg);
      border-radius: 100px;

      &:hover {
        @media (min-width: 1024px) {
          color: var(--color-bg);
        }
      }

      .plus-icon {
        font-size: 1.2rem;
      }
    }
  }
}
.module-grid {
  .grid-item {
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
        @media (min-width: 1024px) {
          transform: scale(1.05);
        }
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
        align-content: flex-end;
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
  &.sets {
    .content-grid__items {
      .grid-item {
        /* border-bottom: 0.09325rem solid var(--color-text); */
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
            @media (min-width: 1024px) {
              transform: scale(1.05);
            }
          }
        }

        :deep(img) {
          @apply object-cover;
          @apply max-w-full w-100;
        }
      }
    }
  }
  &.pool {
    .content-grid__items {
      .grid-item {
        /* border-bottom: 0.09325rem solid var(--color-text); */
        /* position: relative;
        overflow: visible;
        &:nth-child(3n + 1) {
          &::after {
            position: absolute;
            transform: translate(0, 0);
            right: calc(var(--big-margin) * -1);
            background-color:var(--color-text);
            content: '';
            display: block;
            width: 0.06125rem;
            height: 80%;
          }
        }
        &:nth-child(3n + 2) {
          &::after {
            position: absolute;
            transform: translate(0, 0);
            right: calc(var(--big-margin) * -1);
            background-color:var(--color-text);
            content: '';
            display: block;
            width: 0.06125rem;
            height: 80%;
          }
        } */
        &__image {
          position: relative;
          overflow: hidden;

          img {
            width: 100%;
            height: auto;
            aspect-ratio: 3 / 4 !important;
            object-fit: cover;
            transition: transform 0.3s ease;
          }
        }

        :deep(img) {
          @apply object-cover;
          @apply max-w-full w-100;
        }
      }
    }
  }
  &.words {
    .content-grid__items {
      gap: calc(var(--big-padding) * 3);
      .grid-item {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: flex-start;
        width: 100%;
        flex: 1 1 50%;
        max-width: calc(50% - var(--big-padding) * 1.5);
        background-color: var(--color-text);
        border-radius: 12px;
        border: 1px solid var(--color-text);
        overflow: hidden;
        padding: 0;

        &:last-of-type {
          justify-self: flex-start;
          margin: 0 auto 0 0;
        }

        &__link {
          display: contents;
          text-decoration: none;
          color: inherit;
        }

        .city-tags,
        .grid-item__content__interactive {
          display: none;
        }

        img {
          width: 100% !important;
          height: auto;
          aspect-ratio: 3 / 2 !important;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        &__image {
          position: relative;
          overflow: hidden;

          img {
            width: 100%;
            height: auto;
            aspect-ratio: 3 / 1.5 !important;
            object-fit: cover;
            transition: transform 0.3s ease;
          }

          &:hover img {
            @media (min-width: 1024px) {
              transform: scale(1.05);
            }
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
          gap: var(--big-padding);
          margin: 0;
          padding: var(--base-margin) var(--mid-padding) var(--base-margin);
          .grid-item__tags {
            position: absolute;
            top: var(--base-padding);
            right: var(--base-padding);
            display: flex;
            flex-flow: row wrap;
            justify-content: flex-start;
            align-items: flex-end;
            align-content: flex-end;
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

          .read-more {
            position: absolute;
            transform: translate(0, calc(var(--base-margin) * -1 - 50%));
            .tag {
              border: 1px solid var(--color-text);
              background-color: var(--color-bg);
              color: var(--color-text);
            }
          }

          .grid-item__title {
            font-size: var(--large-font-size);
            font-weight: 400;
            text-transform: uppercase;
            font-family: var(--font-text-regular);
            margin: 0;
            color: var(--color-bg);
          }

          .grid-item__artist {
            font-size: var(--base-font-size);
            text-transform: uppercase;
            font-family: var(--font-text-semibold);
            margin: 0;
          }

          .rich-text {
            color: var(--color-bg);
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