<script setup>
import { useMainStore } from "~/stores/mainStore";
const { locale, setLocale } = useI18n();
const localePath = useLocalePath();
const route = useRoute();

const props = defineProps({
  type: {
    type: String,
    default: () => "external",
  },
  href: {
    type: String,
    default: () => "",
  },
  blank: {
    type: Boolean,
    default: () => false,
  },
  route: {
    type: String,
    default: () => "",
  },
  slug: {
    type: String,
    default: () => "",
  },
  func: {
    type: String,
    default: () => "",
  },
  parentActive: {
    type: Boolean,
    default: () => true,
  },
});

const query = route.query;
const internalRoute = computed(() => {
  return {
    name: props?.route ?? "index",
    params: props?.slug ? { slug: props?.slug } : {},
    query: query,
  };
});

const { $CC } = useNuxtApp();
const mainStore = useMainStore();

// Verbesserte Funktion zur Prüfung, ob eine Route aktiv ist, auch bei mehrfacher Verschachtelung
const isActive = computed(() => {
  if (props.type !== "internal" || !props.parentActive) return false;
  
  // Index-Route ist ein Spezialfall
  if (props.route === "index" || !props.route) {
    return route.path === "/" || route.path === `/${locale.value}/`;
  }

  // Bestimme den Pfad des Links
  const linkPath = localePath({
    name: props.route,
    params: props.slug ? { slug: props.slug } : {},
  });

  // Pfade ohne Trailing Slash normalisieren
  const normalizedLinkPath = linkPath.endsWith("/") 
    ? linkPath.slice(0, -1) 
    : linkPath;
  
  const normalizedRoutePath = route.path.endsWith("/") 
    ? route.path.slice(0, -1) 
    : route.path;

  // 1. Prüfe auf exakte Übereinstimmung
  if (normalizedRoutePath === normalizedLinkPath) {
    return true;
  }

  // 2. Prüfe, ob die aktuelle Route eine Unterseite des Links ist
  // Wichtig: Wir prüfen auf /path/ mit Slash am Ende, um sicherzustellen,
  // dass wir nur vollständige Pfadsegmente matchen
  if (normalizedLinkPath !== '/' && normalizedRoutePath.startsWith(normalizedLinkPath + '/')) {
    return true;
  }

  // 3. Prüfe Haupt-Sektionen der Website
  // Wir extrahieren das erste Segment und vergleichen es mit den bekannten Hauptrouten
  const routeSegments = normalizedRoutePath.split('/').filter(Boolean);
  const linkSegments = normalizedLinkPath.split('/').filter(Boolean);

  // Wenn keine Segmente vorhanden sind, ist es nicht aktiv
  if (routeSegments.length === 0 || linkSegments.length === 0) return false;

  // Hauptrouten-Prüfung (funktioniert auch bei tiefer verschachtelten Pfaden)
  if (routeSegments[0] === linkSegments[0]) {
    // Für Hauptsektionen wie 'shows', 'pool', 'words' etc.
    if (['shows', 'pool', 'words', 'info', 'schedule'].includes(linkSegments[0])) {
      return true;
    }
  }

  // 4. Slug-basierte Prüfung
  // Wenn ein spezifischer Slug vorhanden ist, muss dieser exakt übereinstimmen
  if (props.slug) {
    return normalizedRoutePath === normalizedLinkPath;
  }

  return false;
});

const onClick = (func) => {
  switch (func) {
    case "cookie":
      if (!mainStore?.siteCookieBanner?.useCookieBanner) {
        return console.warn(
          `'${func}' triggered but cookie banner is not used.`
        );
      }
      $CC.showPreferences();
      break;
    default:
      console.warn(`Function '${func}' not defined.`);
  }
};
</script>

<template>
  <NuxtLink
    v-if="type !== 'function'"
    :key="`rt-${locale}`"
    :to="props.type !== 'internal' ? props?.href : localePath(internalRoute)"
    :target="props?.blank && props?.type !== 'internal' ? '_blank' : undefined"
    :download="props.type === 'download' ? true : undefined"
    :rel="props?.blank && props?.type !== 'internal' ? 'noopener' : undefined"
    :class="{ 'parent-active': isActive }"
    ><slot/></NuxtLink>
  <button v-else class="link-style" @click="onClick(props?.func)">
    <slot />
  </button>
</template>

<style lang="postcss" scoped>
/* Die parent-active Klasse wird für übergeordnete Routen verwendet */
.parent-active {
}

/* Normale router-link-active und router-link-exact-active Styles beibehalten */
.router-link-exact-active {
}

/* a[target="_blank"] {
  @apply after:content-['↗'];
}

a[download] {
  @apply after:content-['↓'];
} */

/* Navigations-spezifische Styles */
:where(nav) {
  .router-link-exact-active,
  .router-link-active,
  .parent-active {
    color: var(--color-bg);
    background-color: var(--color-text);
  }
}
</style>