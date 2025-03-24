<script setup>
import { useMainStore } from "~/stores/mainStore";
import {
  ref,
  computed,
  onMounted,
  onBeforeUnmount,
  nextTick,
  watch,
} from "vue";

const props = defineProps({
  track: {
    type: Object,
    default: () => null,
  },
});

const mainStore = useMainStore();
const iframeContainer = ref(null);
const isPlaying = ref(false);
const isLoading = ref(true);
const iframeSrc = ref("");
const localWidget = ref(null);
const isWidgetReady = ref(false);
const localTrack = ref(props.track);
const isComponentMounted = ref(false);
const trackError = ref(null);
const playerRendered = ref(false); // Neuer State für das Rendering des Players

// Hilfsfunktion zum Prüfen und Initialisieren des Players
function checkAndInitializePlayer() {

  if (!localTrack.value) {
    return;
  }

  if (!iframeContainer.value) {
    setTimeout(checkAndInitializePlayer, 100);
    return;
  }

  initializeIframe();
}

// SoundCloud URL aus dem Track-Objekt extrahieren
const trackUrl = computed(() => {
  if (!localTrack.value) return null;

  // Priorisiere permalink_url, da stream_url nicht mit dem Widget funktioniert
  if (localTrack.value.permalink_url) {
    return localTrack.value.permalink_url;
  }

  if (localTrack.value.uri) {
    return localTrack.value.uri;
  }

  // Für verschachtelte Objekte
  if (localTrack.value.soundcloud?.tracks?.[0]?.permalink_url) {
    return localTrack.value.soundcloud.tracks[0].permalink_url;
  }

  // Wenn nur eine ID vorhanden ist, konstruiere die URL
  if (localTrack.value.id || localTrack.value.track_id) {
    return `https://api.soundcloud.com/tracks/${
      localTrack.value.id || localTrack.value.track_id
    }`;
  }

  // Fallback auf stream_url, obwohl es möglicherweise nicht funktioniert
  if (localTrack.value.stream_url) {
    // Versuche zu erkennen, ob es eine Direkt-Stream-URL oder eine API-URL ist
    if (localTrack.value.stream_url.includes("api.soundcloud.com/tracks/")) {
      // Extrahiere die Track-ID und wandle sie in eine permalink_url um
      const trackIdMatch = localTrack.value.stream_url.match(/tracks\/(\d+)/);
      if (trackIdMatch && trackIdMatch[1]) {
        return `https://api.soundcloud.com/tracks/${trackIdMatch[1]}`;
      }
    }
    return localTrack.value.stream_url;
  }

  console.warn(
    "Keine gültige SoundCloud permalink_url gefunden",
    localTrack.value
  );
  return null;
});

// Track-ID für Tracking und Vergleiche
const trackId = computed(() => {
  return (
    localTrack.value?.id ||
    localTrack.value?.track_id ||
    localTrack.value?.tracks?.[0]?.id ||
    localTrack.value?.soundcloud?.tracks?.[0]?.id ||
    `track-${Date.now()}`
  );
});

// SoundCloud Widget API laden
function loadSoundCloudWidget() {
  return new Promise((resolve) => {
    if (window.SC && window.SC.Widget) {
      resolve(window.SC.Widget);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://w.soundcloud.com/player/api.js";
    script.onload = () => {
      resolve(window.SC.Widget);
    };
    document.body.appendChild(script);
  });
}

// iFrame initialisieren
async function initializeIframe() {

  if (!trackUrl.value) {
    // Wenn keine trackUrl, aber eine track_id oder ID vorhanden ist, versuche diese zu verwenden
    const trackIdValue = localTrack.value?.id || localTrack.value?.track_id;
    if (trackIdValue) {
      const fallbackUrl = `https://api.soundcloud.com/tracks/${trackIdValue}`;

      // iFrame-URL erstellen mit extra kompaktem Layout
      iframeSrc.value = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        trackUrl.value
      )}&color=%23f794b3&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&show_artwork=false`;

      try {
        // SoundCloud Widget API laden
        const Widget = await loadSoundCloudWidget();

        // Widget wird später nach dem Rendern des iFrames initialisiert
        nextTick(() => {
          setTimeout(() => {
            setupWidget(Widget);
          }, 500);
        });
      } catch (error) {
        trackError.value = "Fehler beim Initialisieren des Players.";
        isLoading.value = false;
      }
      return;
    }

    trackError.value = "Keine gültige SoundCloud URL gefunden.";
    console.warn("Keine Track-URL verfügbar");
    isLoading.value = false;
    return;
  }

  if (!iframeContainer.value) {
    trackError.value = "Player-Container konnte nicht gefunden werden.";
    console.warn("iframeContainer-Ref nicht verfügbar");
    isLoading.value = false;
    return;
  }

  try {
    // SoundCloud Widget API laden
    const Widget = await loadSoundCloudWidget();

    // iFrame-URL erstellen mit extra kompaktem Layout
    // In deiner initializeIframe-Funktion:
    iframeSrc.value = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      trackUrl.value
    )}&color=%23f794b3&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&show_artwork=false`;


    // Widget wird später nach dem Rendern des iFrames initialisiert
    nextTick(() => {
      setTimeout(() => {
        setupWidget(Widget);
      }, 500);
    });
  } catch (error) {
    console.error("Fehler beim Initialisieren des iFrames:", error);
    trackError.value = "Fehler beim Initialisieren des Players.";
    isLoading.value = false;
  }
}

function setupWidget(Widget) {
  const iframe = iframeContainer.value?.querySelector("iframe");
  if (iframe) {
    try {
      localWidget.value = Widget(iframe);
      setupWidgetEvents();
    } catch (error) {
      console.error("Fehler bei Widget-Initialisierung:", error);
      trackError.value = "Fehler bei Player-Initialisierung.";
    }
    isLoading.value = false;
  } else {
    console.error("Kein iframe im Container gefunden");
    trackError.value = "Player konnte nicht initialisiert werden.";
    isLoading.value = false;
  }
}

// Verbesserte setupWidgetEvents-Funktion
function setupWidgetEvents() {
  if (!localWidget.value || !window.SC) {
    return;
  }

  try {
    const SC = window.SC;

    // READY Event
    localWidget.value.bind(SC.Widget.Events.READY, () => {
      isWidgetReady.value = true;
      isLoading.value = false;

      // Nach dem Ready-Event den aktuellen Status abfragen
      setTimeout(() => {
        localWidget.value.isPaused((paused) => {
          isPlaying.value = !paused;
          mainStore.setPlayerStatus(!paused); // Aktualisiere den Store
        });
      }, 100);
    });

    // PLAY Event mit Fehlerbehandlung
    localWidget.value.bind(SC.Widget.Events.PLAY, () => {
      isPlaying.value = true;
      mainStore.setPlayerStatus(true); // Aktualisiere den Store
      // Doppelprüfung, ob wirklich abgespielt wird
      setTimeout(() => {
        localWidget.value.isPaused((paused) => {
          if (paused && isPlaying.value) {
            isPlaying.value = false;
          }
        });
      }, 100);
    });

    // PLAY_PROGRESS Event (wichtig für Statusverfolgung)
    localWidget.value.bind(SC.Widget.Events.PLAY_PROGRESS, () => {
      if (!isPlaying.value) {
        isPlaying.value = true;
      }
    });

    // PAUSE Event mit Fehlerbehandlung
    localWidget.value.bind(SC.Widget.Events.PAUSE, () => {
      isPlaying.value = false;
      mainStore.setPlayerStatus(false); // Aktualisiere den Store

      // Doppelprüfung, ob wirklich pausiert ist
      setTimeout(() => {
        localWidget.value.isPaused((paused) => {
          if (!paused && !isPlaying.value) {
            isPlaying.value = true;
          }
        });
      }, 100);
    });

    // FINISH Event
    localWidget.value.bind(SC.Widget.Events.FINISH, () => {
      isPlaying.value = false;
      mainStore.setPlayerStatus(false); // Aktualisiere den Store
    });

    localWidget.value.bind(SC.Widget.Events.ERROR, (e) => {
      console.error("ERROR Event ausgelöst", e);
      trackError.value = "Es ist ein Fehler beim Abspielen aufgetreten.";
      isPlaying.value = false;
    });
  } catch (error) {
    console.error("Fehler beim Einrichten der Widget-Events:", error);
  }
}

onMounted(() => {
  isComponentMounted.value = true;

  // Wenn bereits ein Track vorhanden ist beim Mounten
  if (props.track || mainStore.currentTrack) {
    const trackToUse = props.track || mainStore.currentTrack;
    localTrack.value = trackToUse;
    playerRendered.value = true;

    // Warten auf DOM-Update
    nextTick(() => {
      setTimeout(() => {
        checkAndInitializePlayer();
      }, 200);
    });
  }

  watch(
    () => mainStore.currentTrack,
    (newTrack, oldTrack) => {

      // Frühzeitig beenden, wenn newTrack null ist
      if (!newTrack) {
        return; // Beende frühzeitig, wenn kein Track vorhanden
      }

      try {
        // Prüfen, ob es sich um einen neuen Track handelt oder um den gleichen
        const newTrackId = newTrack?.id || newTrack?.track_id;
        const oldTrackId = oldTrack?.id || oldTrack?.track_id;

        // Nur neu initialisieren, wenn es ein anderer Track ist
        if (
          newTrackId !== oldTrackId &&
          newTrack &&
          typeof newTrack === "object"
        ) {
          trackError.value = null;
          playerRendered.value = true;

          // Prüfen, ob der Track eine URL hat oder andere relevante Eigenschaften
          const hasPermalinkUrl =
            newTrack.permalink_url ||
            newTrack.uri ||
            newTrack.soundcloud?.tracks?.[0]?.permalink_url;

          // Wenn der Track eine ID hat, aber keine Permalink-URL
          if (!hasPermalinkUrl && (newTrack.id || newTrack.track_id)) {
            newTrack.permalink_url = `https://api.soundcloud.com/tracks/${
              newTrack.id || newTrack.track_id
            }`;
          }

          localTrack.value = newTrack;

          // Player mit dem neuen Track nur initialisieren, wenn die Komponente gemountet ist
          if (isComponentMounted.value) {
            isLoading.value = true;

            // Warten auf den nächsten DOM-Zyklus und dann mit Verzögerung initialisieren
            nextTick(() => {
              setTimeout(() => {
                checkAndInitializePlayer();
              }, 200);
            });
          } else {
          }
        } else if (newTrack === oldTrack && newTrack) {
          playerRendered.value = true;
        } else {
        }
      } catch (error) {
        console.error("Fehler im Track-Watcher:", error);
        trackError.value =
          "Es ist ein Fehler beim Laden des Tracks aufgetreten.";
      }
    },
    { immediate: true }
  );
});

onBeforeUnmount(() => {
  if (localWidget.value && window.SC) {
    try {
      // Events aufräumen
      const events = [
        window.SC.Widget.Events.READY,
        window.SC.Widget.Events.PLAY,
        window.SC.Widget.Events.PAUSE,
        window.SC.Widget.Events.FINISH,
        window.SC.Widget.Events.ERROR,
      ];

      events.forEach((event) => {
        if (event) localWidget.value.unbind(event);
      });
    } catch (error) {
      console.error("Fehler beim Aufräumen der Events:", error);
    }
  }
});
</script>

<template>
  <div
    v-if="localTrack"
    class="soundcloud-player"
    :class="{ 'is-loading': isLoading }"
  >
    <template v-if="localTrack">
      <div v-if="trackError" class="soundcloud-player__error">
        <p>{{ trackError }}</p>
      </div>

      <div
        ref="iframeContainer"
        class="iframe-container"
        :class="{ 'is-loaded': !isLoading }"
      >
        <iframe
          v-if="iframeSrc"
          width="100%"
          height="116"
          scrolling="no"
          frameborder="no"
          allow="autoplay"
          :src="iframeSrc"
          :key="trackId"
        >
        </iframe>
      </div>
    </template>
  </div>
  <div v-else></div>
</template>

<style lang="postcss" scoped>
.soundcloud-player {
  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto;
  position: relative;
  max-height: 116px;

  .soundcloud-player__error {
    padding: 1rem;
    background-color: #ffeded;
    color: #d14343;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    border: 1px solid #f5d0d0;

    p {
      margin: 0;
    }
  }

  .iframe-container {
    width: 100%;
    opacity: 0;
    transition: opacity 0.3s ease;

    &.is-loaded {
      opacity: 1;
    }

    iframe {
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }
  }

  /* &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 166px;
    background-color: #f5f5f5;
    border-radius: 8px;
    margin-bottom: 1rem;

    .dots {
      display: flex;
      gap: 6px;
      margin-bottom: 10px;

      span {
        display: block;
        width: 8px;
        height: 8px;
        background-color: #666;
        border-radius: 50%;
        animation: pulse 1.4s infinite ease-in-out both;

        &:nth-child(1) {
          animation-delay: -0.32s;
        }

        &:nth-child(2) {
          animation-delay: -0.16s;
        }
      }
    }

    p {
      font-size: 14px;
      color: #666;
      margin: 0;
    }
  }

  @keyframes pulse {
    0%,
    80%,
    100% {
      transform: scale(0.4);
    }
    40% {
      transform: scale(1);
    }
  } */
}
</style>