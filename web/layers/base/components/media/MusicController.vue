<script setup>
import { ref, computed, watch, onMounted, shallowRef } from "vue";
import { useAsyncData } from "#imports";

// API-Key aus Umgebungsvariablen
const apiKey = process.env.NUXT_LIBRETIME_API_KEY ?? "DMGSLT4FB25H33034RG4";

// Stream-URLs definieren
const streamUrl1 = "https://icecast.callshopradio.com/callshopradio";
const streamUrl2 = "https://icecast.callshopradio.com/callshopradio-wien";

// Wir speichern die Audio-Elemente außerhalb von Vue's Reaktivitätssystem
let audioEl1 = null;
let audioEl2 = null;

// Status-Refs
const isPlaying1 = ref(false);
const isPlaying2 = ref(false);
const isLoading1 = ref(false);
const isLoading2 = ref(false);

// Separat gespeicherter Live-Status, der nicht automatisch aktualisiert wird
const liveStatus = ref({
  stream1: {
    onAirLight: {},
    liveData: {},
    icecastData: {},
  },
  stream2: {
    onAirLight: {},
    liveData: {},
  },
});

// Hilfsfunktion für API-Aufrufe
const fetcher = async (url, apiKey = null) => {
  try {
    const headers = apiKey
      ? {
          Authorization: `Api-Key ${apiKey}`,
          "Content-Type": "application/json",
        }
      : {};
    const response = await fetch(url, { headers });

    if (!response.ok)
      throw new Error(`Error fetching data: ${response.statusText}`);
    return await response.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
};

// Manuelle Status-Aktualisierungsfunktion
const updateLiveStatus = async () => {
  try {
    // Stream 1
    const liveInfoUrl1 = "https://libretime.callshopradio.com/api/live-info-v2";
    const onAirLightUrl1 = `https://libretime.callshopradio.com/api/on-air-light/format/json?api_key=${apiKey}`;
    const icecastUrl = "https://icecast.callshopradio.com/status-json.xsl";

    // Stream 2
    const liveInfoUrl2 =
      "https://wien.callshopradio.com/api/live-info-v2?days=7";

    const [liveData1, onAirLight1, icecastData, liveData2] = await Promise.all([
      fetcher(liveInfoUrl1),
      fetcher(onAirLightUrl1),
      fetcher(icecastUrl).catch(() => null),
      fetcher(liveInfoUrl2),
    ]);

    // Format für Stream 2 anpassen
    let onAirLight2 = null;
    if (liveData2) {
      onAirLight2 = {
        on_air_light:
          liveData2.sources.livedj === "on" ||
          liveData2.sources.masterdj === "on",
        live_stream: liveData2.sources.livedj === "on",
        live_stream_on_air: liveData2.sources.livedj === "on",
        master_stream: liveData2.sources.masterdj === "on",
        master_stream_on_air: liveData2.sources.masterdj === "on",
      };
    }

    // Status aktualisieren ohne die Audio-Elemente zu stören
    liveStatus.value = {
      stream1: {
        onAirLight: onAirLight1 || {},
        liveData: liveData1 || {},
        icecastData: icecastData || {},
      },
      stream2: {
        onAirLight: onAirLight2 || {},
        liveData: liveData2 || {},
      },
    };
  } catch (error) {
    console.error("Error updating live status:", error);
  }
};

// Funktion zum Abspielen und Stoppen des Streams für Track 1
const togglePlay1 = () => {
  if (!audioEl1) return;

  console.log("togglePlay1 aufgerufen", isPlaying1.value);

  if (isPlaying1.value) {
    audioEl1.pause();
    isPlaying1.value = false;
    isLoading1.value = false;
  } else {
    // Wenn Track 2 gerade spielt, pausieren
    if (isPlaying2.value && audioEl2) {
      audioEl2.pause();
      isPlaying2.value = false;
      isLoading2.value = false;
    }

    isLoading1.value = true;

    // Stream neu laden, um sicherzustellen, dass er von Anfang startet
    audioEl1.src = streamUrl1;
    audioEl1.load();

    // Audio-Kontext neu erstellen bei jedem Play
    const playPromise = audioEl1.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isLoading1.value = false;
          isPlaying1.value = true;
          console.log("Stream 1 spielt erfolgreich");
        })
        .catch((err) => {
          console.error("Error playing stream 1:", err);
          isLoading1.value = false;
        });
    }
  }
};

// Funktion zum Abspielen und Stoppen des Streams für Track 2
const togglePlay2 = () => {
  if (!audioEl2) return;

  console.log("togglePlay2 aufgerufen", isPlaying2.value);

  if (isPlaying2.value) {
    audioEl2.pause();
    isPlaying2.value = false;
    isLoading2.value = false;
  } else {
    // Wenn Track 1 gerade spielt, pausieren
    if (isPlaying1.value && audioEl1) {
      audioEl1.pause();
      isPlaying1.value = false;
      isLoading1.value = false;
    }

    isLoading2.value = true;

    // Stream neu laden, um sicherzustellen, dass er von Anfang startet
    audioEl2.src = streamUrl2;
    audioEl2.load();

    // Audio-Kontext neu erstellen bei jedem Play
    const playPromise = audioEl2.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isLoading2.value = false;
          isPlaying2.value = true;
          console.log("Stream 2 spielt erfolgreich");
        })
        .catch((err) => {
          console.error("Error playing stream 2:", err);
          isLoading2.value = false;
        });
    }
  }
};

// Parse strings mit Entities
const parseString = (string) => {
  if (!string) return "";
  return string
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"');
};

// Berechne den aktuellen Titel für Stream 1
const getCurrentName1 = computed(() => {
  const { onAirLight, liveData, icecastData } = liveStatus.value.stream1;

  if (onAirLight?.on_air_light) {
    if (onAirLight?.master_stream) {
      const title = icecastData?.icestats?.source?.[0]?.title || "";
      return title ? parseString(title) : "Live Stream 1";
    } else if (liveData?.tracks?.current) {
      if (liveData.tracks.current.metadata) {
        const artist = liveData.tracks.current.metadata.artist_name || "";
        const title = liveData.tracks.current.metadata.track_title || "";

        if (artist && artist !== title) {
          return parseString(`${title} - ${artist}`);
        }
        return parseString(title);
      } else if (liveData.shows?.current) {
        return parseString(
          liveData.shows.current.name.replace(" - Live Stream", "")
        );
      }
    }
  }

  if (liveData?.shows?.next?.length > 0) {
    const nextShow = liveData.shows.next[0];
    const startSplitted = nextShow.starts.split(" ");
    const date = new Date(`${startSplitted[0]}T${startSplitted[1]}Z`);

    const hoursNext = date.getUTCHours();
    const minutesNext =
      date.getUTCMinutes() < 10
        ? "0" + date.getUTCMinutes()
        : date.getUTCMinutes();

    return `Next (${hoursNext}:${minutesNext}): ${parseString(nextShow.name)}`;
  }

  return "Stream 1";
});

// Berechne den aktuellen Titel für Stream 2
const getCurrentName2 = computed(() => {
  const { onAirLight, liveData } = liveStatus.value.stream2;

  if (onAirLight?.on_air_light) {
    if (onAirLight?.master_stream) {
      const title =
        liveStatus.value.stream1.icecastData?.icestats?.source?.[1]?.title ||
        "";
      return title ? parseString(title) : "Live Stream 2";
    } else if (liveData?.tracks?.current) {
      if (liveData.tracks.current.metadata) {
        const artist = liveData.tracks.current.metadata.artist_name || "";
        const title = liveData.tracks.current.metadata.track_title || "";

        if (artist && artist !== title) {
          return parseString(`${title} - ${artist}`);
        }
        return parseString(title);
      } else if (liveData.shows?.current) {
        return parseString(
          liveData.shows.current.name.replace(" - Live Stream", "")
        );
      }
    }
  }

  if (liveData?.shows?.next?.length > 0) {
    const nextShow = liveData.shows.next[0];
    const startSplitted = nextShow.starts.split(" ");
    const date = new Date(`${startSplitted[0]}T${startSplitted[1]}Z`);

    const hoursNext = date.getUTCHours();
    const minutesNext =
      date.getUTCMinutes() < 10
        ? "0" + date.getUTCMinutes()
        : date.getUTCMinutes();

    return `Next (${hoursNext}:${minutesNext}): ${parseString(nextShow.name)}`;
  }

  return "Stream 2";
});

// Audio-Elemente konfigurieren
const setupAudioElement = (audioElement, num) => {
  if (!audioElement) return;

  // Grundkonfiguration
  audioElement.volume = 1.0;
  audioElement.preload = "metadata"; // Nur Metadaten vorab laden
  audioElement.crossOrigin = "anonymous";

  // Event-Listener
  audioElement.addEventListener("play", () => {
    if (num === 1) {
      isPlaying1.value = true;
      isLoading1.value = false;
    } else {
      isPlaying2.value = true;
      isLoading2.value = false;
    }
    console.log(`Stream ${num} is playing`);
  });

  audioElement.addEventListener("waiting", () => {
    if (num === 1) {
      isLoading1.value = true;
    } else {
      isLoading2.value = true;
    }
    console.log(`Stream ${num} is buffering`);
  });

  audioElement.addEventListener("pause", () => {
    if (num === 1) {
      isPlaying1.value = false;
      isLoading1.value = false;
    } else {
      isPlaying2.value = false;
      isLoading2.value = false;
    }
    console.log(`Stream ${num} paused`);
  });

  audioElement.addEventListener("ended", () => {
    if (num === 1) {
      isPlaying1.value = false;
    } else {
      isPlaying2.value = false;
    }
    console.log(`Stream ${num} ended`);
  });

  audioElement.addEventListener("error", (e) => {
    console.error(`Stream ${num} error:`, e);
    if (num === 1) {
      isPlaying1.value = false;
      isLoading1.value = false;
    } else {
      isPlaying2.value = false;
      isLoading2.value = false;
    }
  });

  // HLS-Streaming für bessere Kompatibilität hinzufügen
  try {
    // Audio-Streams haben oft MIME-Typ issues. Auf gängige Icecast-Server-Optionen fallback
    audioElement.addEventListener("canplaythrough", () => {
      console.log(`Stream ${num} can play through`);
    });

    // Verhindere automatischen Start
    audioElement.autoplay = false;
  } catch (e) {
    console.error(`Error configuring audio ${num}:`, e);
  }
};

// Live-Status regelmäßig aktualisieren (separater Timer)
let statusUpdateInterval = null;

// Nach dem Mounten Audio-Event-Handler einrichten
onMounted(() => {
  // Hole die Audio-Elemente nach dem Mounten
  audioEl1 = document.getElementById("audioPlayer1");
  audioEl2 = document.getElementById("audioPlayer2");

  // Konfiguriere Audio-Elemente
  setupAudioElement(audioEl1, 1);
  setupAudioElement(audioEl2, 2);

  // MediaSession API für Mediensteuerung
  if ("mediaSession" in navigator) {
    navigator.mediaSession.setActionHandler("play", () => {
      if (isPlaying1.value && audioEl1) {
        audioEl1.play();
      } else if (isPlaying2.value && audioEl2) {
        audioEl2.play();
      }
    });

    navigator.mediaSession.setActionHandler("pause", () => {
      if (isPlaying1.value && audioEl1) {
        audioEl1.pause();
      } else if (isPlaying2.value && audioEl2) {
        audioEl2.pause();
      }
    });
  }

  // Initial die Status-Daten laden
  updateLiveStatus();

  // Status-Update-Timer einrichten
  statusUpdateInterval = setInterval(() => {
    // Nur aktualisieren, wenn keine Audio-Wiedergabe läuft
    // oder wenn Metadaten aktualisiert werden sollen
    updateLiveStatus();
  }, 10000); // Alle 10 Sekunden aktualisieren
});

// Timer aufräumen beim Entfernen der Komponente
const onBeforeUnmount = () => {
  if (statusUpdateInterval) {
    clearInterval(statusUpdateInterval);
  }
};

// Initialer Aufruf, um sofort Daten zu haben
updateLiveStatus();
</script>

<template>
  <div class="audio-player">
    <div class="audio-player__wrapper">
      <div
        class="audio-player__music-controller track-one"
        @click="togglePlay1"
        :class="{
          active: isPlaying1 || isLoading1,
          inactive: isPlaying2 || isLoading2,
          offline: !liveStatus.stream1.onAirLight.on_air_light,
        }"
      >
        <h2>1</h2>
        <button>
          <div v-if="isLoading1" class="loading-indicator">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <svg
            v-else-if="isPlaying1"
            class="pause"
            width="8"
            height="10"
            viewBox="0 0 8 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="3" height="10" />
            <rect x="5" width="3" height="10" />
          </svg>
          <svg
            v-else
            class="play"
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
        <p class="track-name">{{ getCurrentName1 }}</p>
        <p
          :class="`live-indicator ${
            liveStatus.stream1.onAirLight.on_air_light ? 'live' : 'offline'
          }`"
        >
          <svg
            v-if="liveStatus.stream1.onAirLight.on_air_light"
            width="9"
            height="9"
            viewBox="0 0 9 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="4.5" cy="4.5" r="4.5" fill="black" />
          </svg>
          {{ liveStatus.stream1.onAirLight.on_air_light ? "Live" : "Offline" }}
        </p>
      </div>
      <div
        class="audio-player__music-controller track-two"
        @click="togglePlay2"
        :class="{
          active: isPlaying2 || isLoading2,
          inactive: isPlaying1 || isLoading1,
          offline: !liveStatus.stream2.onAirLight.on_air_light,
        }"
      >
        <h2>2</h2>
        <button>
          <div v-if="isLoading2" class="loading-indicator">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
          <svg
            v-else-if="isPlaying2"
            class="pause"
            width="8"
            height="10"
            viewBox="0 0 8 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="3" height="10" fill="black" />
            <rect x="5" width="3" height="10" fill="black" />
          </svg>
          <svg
            v-else
            class="play"
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
        <p class="track-name">{{ getCurrentName2 }}</p>
        <p
          :class="`live-indicator ${
            liveStatus.stream2.onAirLight.on_air_light ? 'live' : 'offline'
          }`"
        >
          <svg
            v-if="liveStatus.stream2.onAirLight.on_air_light"
            width="9"
            height="9"
            viewBox="0 0 9 9"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="4.5" cy="4.5" r="4.5" fill="black" />
          </svg>

          {{ liveStatus.stream2.onAirLight.on_air_light ? "Live" : "Offline" }}
        </p>
      </div>
    </div>

    <!-- Audio-Elemente komplett außerhalb von Vue's Reaktivitätssystem -->
    <audio id="audioPlayer1" :src="streamUrl1"></audio>
    <audio id="audioPlayer2" :src="streamUrl2"></audio>
  </div>
</template>

<style scoped lang="postcss">
.audio-player {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: flex-start;
  padding: var(--small-padding) 0;

  &__wrapper {
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    width: 100%;
  }

  &__music-controller {
    display: flex;
    flex-flow: row;
    justify-content: flex-start;
    align-items: center;
    gap: var(--small-padding);
    max-width: calc(var(--page-max-width) / 2);
    width: 50%;
    transition: width 0.15s ease, max-width 0.15s ease;
    cursor: pointer;
    &.offline {
      cursor: not-allowed !important;
      pointer-events: none;
      .live-indicator{
        color: var(--color-grey);
      }

      opacity: 0.5;
    }
    button {
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-items: center;
      margin: 0 var(--big-padding) 0 0;
      color: transparent;
      background-color: transparent;
      border: none;

      svg {
        rect,
        path {
          fill: var(--color-text);
        }
      }

      .loading-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;

        .dot {
          display: inline-block;
          width: 4px;
          height: 4px;
          background-color: var(--color-text);
          border-radius: 50%;
          animation: dotPulse 1.5s infinite ease-in-out;

          &:nth-child(1) {
            animation-delay: 0s;
          }

          &:nth-child(2) {
            animation-delay: 0.2s;
          }

          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
      }
    }
    h2 {
      font-size: var(--base-font-size);
    }
    p {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      text-transform: uppercase;
      &.live-indicator {
        display: flex;
        flex-flow: row;
        align-items: center;
        gap: var(--small-padding);
        letter-spacing: var(--menu-letter-spacing);
        svg {
          height: var(--base-font-size);
          height: var(--base-font-size);
          circle {
            fill: var(--color-pink);
          }
          fill: var(--color-pink);
        }
        overflow: visible;
        text-overflow: clip;
        color: var(--color-pink);
        text-transform: uppercase;
        margin: 0 0 0 auto;
        line-height: var(--base-line-height);
      }
    }
    &.track-one {
      padding: 0 var(--big-padding) 0 0;
      border-right: 1px solid var(--color-text);
    }
    &.track-two {
      padding: 0 0 0 var(--big-padding);
    }
    &.active {
      max-width: calc(var(--page-max-width) / 1.5);
      width: 75%;
    }
    &.inactive {
      max-width: calc(var(--page-max-width) / 3);
      width: 25%;
    }
  }

  /* Audio-Elemente verstecken */
  audio {
    display: none;
  }
}

@keyframes dotPulse {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>