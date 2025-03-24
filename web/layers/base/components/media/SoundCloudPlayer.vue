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
const playerRendered = ref(false); // Player rendering state

// Helper function to check and initialize player
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

// Extract SoundCloud URL from track object
const trackUrl = computed(() => {
  if (!localTrack.value) return null;

  // Prioritize permalink_url as stream_url doesn't work with widget
  if (localTrack.value.permalink_url) {
    return localTrack.value.permalink_url;
  }

  if (localTrack.value.uri) {
    return localTrack.value.uri;
  }

  // For nested objects
  if (localTrack.value.soundcloud?.tracks?.[0]?.permalink_url) {
    return localTrack.value.soundcloud.tracks[0].permalink_url;
  }

  // If only ID is available, construct URL
  if (localTrack.value.id || localTrack.value.track_id) {
    return `https://api.soundcloud.com/tracks/${
      localTrack.value.id || localTrack.value.track_id
    }`;
  }

  // Fallback to stream_url, though it might not work
  if (localTrack.value.stream_url) {
    // Try to detect if it's a direct stream URL or API URL
    if (localTrack.value.stream_url.includes("api.soundcloud.com/tracks/")) {
      // Extract track ID and convert to permalink_url
      const trackIdMatch = localTrack.value.stream_url.match(/tracks\/(\d+)/);
      if (trackIdMatch && trackIdMatch[1]) {
        return `https://api.soundcloud.com/tracks/${trackIdMatch[1]}`;
      }
    }
    return localTrack.value.stream_url;
  }

  return null;
});

// Track ID for tracking and comparison
const trackId = computed(() => {
  return (
    localTrack.value?.id ||
    localTrack.value?.track_id ||
    localTrack.value?.tracks?.[0]?.id ||
    localTrack.value?.soundcloud?.tracks?.[0]?.id ||
    `track-${Date.now()}`
  );
});

// Load SoundCloud Widget API
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

// Initialize iframe
async function initializeIframe() {
  if (!trackUrl.value) {
    // If no trackUrl but track_id or ID is available, try to use it
    const trackIdValue = localTrack.value?.id || localTrack.value?.track_id;
    if (trackIdValue) {
      const fallbackUrl = `https://api.soundcloud.com/tracks/${trackIdValue}`;

      // Create iframe URL with extra compact layout
      iframeSrc.value = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
        trackUrl.value
      )}&color=%23f794b3&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&show_artwork=false`;

      try {
        // Load SoundCloud Widget API
        const Widget = await loadSoundCloudWidget();

        // Widget will be initialized later after iframe rendering
        nextTick(() => {
          setTimeout(() => {
            setupWidget(Widget);
          }, 500);
        });
      } catch (error) {
        trackError.value = "Error initializing player.";
        isLoading.value = false;
      }
      return;
    }

    trackError.value = "No valid SoundCloud URL found.";
    isLoading.value = false;
    return;
  }

  if (!iframeContainer.value) {
    trackError.value = "Player container not found.";
    isLoading.value = false;
    return;
  }

  try {
    // Load SoundCloud Widget API
    const Widget = await loadSoundCloudWidget();

    // Create iframe URL with extra compact layout
    iframeSrc.value = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      trackUrl.value
    )}&color=%23f794b3&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false&show_artwork=false`;

    // Widget will be initialized later after iframe rendering
    nextTick(() => {
      setTimeout(() => {
        setupWidget(Widget);
      }, 500);
    });
  } catch (error) {
    trackError.value = "Error initializing player.";
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
      trackError.value = "Error initializing player.";
    }
    isLoading.value = false;
  } else {
    trackError.value = "Player could not be initialized.";
    isLoading.value = false;
  }
}

// Improved setupWidgetEvents function
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

      // Query current status after ready event
      setTimeout(() => {
        localWidget.value.isPaused((paused) => {
          isPlaying.value = !paused;
          mainStore.setPlayerStatus(!paused); // Update store
        });
      }, 100);
    });

    // PLAY Event with error handling
    localWidget.value.bind(SC.Widget.Events.PLAY, () => {
      isPlaying.value = true;
      mainStore.setPlayerStatus(true); // Update store
      // Double-check if really playing
      setTimeout(() => {
        localWidget.value.isPaused((paused) => {
          if (paused && isPlaying.value) {
            isPlaying.value = false;
          }
        });
      }, 100);
    });

    // PLAY_PROGRESS Event (important for status tracking)
    localWidget.value.bind(SC.Widget.Events.PLAY_PROGRESS, () => {
      if (!isPlaying.value) {
        isPlaying.value = true;
      }
    });

    // PAUSE Event with error handling
    localWidget.value.bind(SC.Widget.Events.PAUSE, () => {
      isPlaying.value = false;
      mainStore.setPlayerStatus(false); // Update store

      // Double-check if really paused
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
      mainStore.setPlayerStatus(false); // Update store
    });

    localWidget.value.bind(SC.Widget.Events.ERROR, (e) => {
      trackError.value = "An error occurred during playback.";
      isPlaying.value = false;
    });
  } catch (error) {
    // Silent error handling
  }
}

onMounted(() => {
  isComponentMounted.value = true;

  // If track already exists on mount
  if (props.track || mainStore.currentTrack) {
    const trackToUse = props.track || mainStore.currentTrack;
    localTrack.value = trackToUse;
    playerRendered.value = true;

    // Wait for DOM update
    nextTick(() => {
      setTimeout(() => {
        checkAndInitializePlayer();
      }, 200);
    });
  }

  watch(
    () => mainStore.currentTrack,
    (newTrack, oldTrack) => {
      // Exit early if newTrack is null
      if (!newTrack) {
        return;
      }

      try {
        // Check if it's a new track or the same
        const newTrackId = newTrack?.id || newTrack?.track_id;
        const oldTrackId = oldTrack?.id || oldTrack?.track_id;

        // Only reinitialize if it's a different track
        if (
          newTrackId !== oldTrackId &&
          newTrack &&
          typeof newTrack === "object"
        ) {
          trackError.value = null;
          playerRendered.value = true;

          // Check if track has URL or other relevant properties
          const hasPermalinkUrl =
            newTrack.permalink_url ||
            newTrack.uri ||
            newTrack.soundcloud?.tracks?.[0]?.permalink_url;

          // If track has ID but no permalink URL
          if (!hasPermalinkUrl && (newTrack.id || newTrack.track_id)) {
            newTrack.permalink_url = `https://api.soundcloud.com/tracks/${
              newTrack.id || newTrack.track_id
            }`;
          }

          localTrack.value = newTrack;

          // Only initialize player with new track if component is mounted
          if (isComponentMounted.value) {
            isLoading.value = true;

            // Wait for next DOM cycle then initialize with delay
            nextTick(() => {
              setTimeout(() => {
                checkAndInitializePlayer();
              }, 200);
            });
          }
        } else if (newTrack === oldTrack && newTrack) {
          playerRendered.value = true;
        }
      } catch (error) {
        trackError.value = "An error occurred while loading the track.";
      }
    },
    { immediate: true }
  );
});

onBeforeUnmount(() => {
  if (localWidget.value && window.SC) {
    try {
      // Clean up events
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
      // Silent error handling
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
}
</style>