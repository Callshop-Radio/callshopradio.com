<script setup>
import { useMainStore } from "~/stores/mainStore";
const { locale, locales } = useI18n();
const localePath = useLocalePath();

const mainStore = useMainStore();
const mainMenu = computed(() => mainStore?.siteNav?.mainMenu);

// console.log(mainStore?.siteNav);

// Computed-Properties für den Track
const currentTrack = computed(() => mainStore.currentTrack);
const trackTitle = computed(() => currentTrack.value?.title || "");
const trackDuration = computed(() => {
  if (!currentTrack.value?.duration) return "";
  // Umwandlung von Millisekunden in MM:SS Format
  const totalSeconds = Math.floor(currentTrack.value.duration / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
});

// Status und Sichtbarkeit des Players
const isPlaying = computed(() => mainStore.isPlayerPlaying);
const isVisible = computed(() => mainStore.isPlayerVisible);

// Methode zum Umschalten der Player-Sichtbarkeit
const togglePlayerVisibility = () => {
  mainStore.togglePlayerVisibility();
};
</script>

<template>
  <div class="header">
    <section class="header__title-section">
      <NuxtLink :to="localePath('/')" class="header__title-section__logo">
        <div class="header__title-section__logo">
          <ElementsCallshopLogo class="logo" />
          <ElementsCallshopTextLogo class="text-logo" />
          <SiteMobileChannelSwitch class="channel-switch" />
        </div>
      </NuxtLink>
      <div class="header__toggle-section">
        <SiteDarkMode />
        <nav class="menu-main tags">
          <ul>
            <NuxtLink :to="localePath('/shows')" :class="`tag shows`">
              Shows
            </NuxtLink>
            <NuxtLink :to="localePath('/pool')" :class="`tag pool`">
              Pool
            </NuxtLink>
            <!-- <NuxtLink :to="localePath('/words')" :class="`tag words`">
              Words
            </NuxtLink> -->
          </ul>
        </nav>
        <SiteDiscordButton
          class="mobile-hidden"
          v-if="mainStore?.siteNav?.discordLink"
        />
        <SiteScheduleButton
          class="mobile-hidden"
          v-if="mainStore?.siteNav?.schedulePage"
        />
        <SiteMenuButton class="mobile-hidden" />
      </div>
    </section>
    <SiteMenu class="mobile-hidden" />
    <section class="header__audio-player-section">
      <MusicController />
    </section>
    <section
      v-if="currentTrack"
      class="header__soundcloud-player-section"
      :class="{ 'is-hidden': !isVisible, 'is-visible': currentTrack }"
    >
      <div class="player-controls" :class="{ 'is-loaded': currentTrack }">
        <div class="track-info">
          <!-- <div class="track-status" :class="{ 'is-playing': isPlaying }"></div> -->
          <div class="track-details">
            <h4 class="track-source">Playing from SoundCloud</h4>
            <h3 class="track-title">{{ trackTitle }}</h3>
            <h4 class="track-duration" v-if="trackDuration">
              {{ trackDuration }}
            </h4>
          </div>
        </div>
        <nav class="player-nav">
          <button @click="togglePlayerVisibility">
            {{ isVisible ? "Hide" : "Show" }}
          </button>
        </nav>
      </div>
      <ClientOnly>
        <SoundCloudPlayer v-if="currentTrack" />
      </ClientOnly>
    </section>
  </div>
</template>

<style scoped lang="postcss">
.header {
  position: sticky;
  top: 0;
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  margin: 0 0;
  padding: 0 0;
  background-color: var(--color-bg);
  @media screen and (max-width: 1100px) {
    margin: 0 0;
  }

  .mobile-hidden {
    @media screen and (max-width: 900px) {
      display: none !important;
    }
  }

  height: auto;
  min-height: max-content;
  z-index: 99999;
  &__title-section {
    width: 100%;
    max-width: var(--page-max-width);
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: center;
    padding: var(--base-padding) 0;
    @media screen and (max-width: 1100px) {
      padding: var(--base-padding);
    }
    .channel-switch {
      @media screen and (min-width: 900px) {
        display: none;
      }
    }
    &__logo {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--small-padding);
      h1 {
        font-family: var(--font-text);
      }
      /* Logo Invertierung im Dark Mode */
      .logo,
      .text-logo {
        @media (prefers-color-scheme: dark) {
          filter: invert(1);
        }
      }
      .text-logo {
        @media screen and (max-width: 900px) {
          display: none;
        }
      }
    }
  }
  &__toggle-section {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--base-padding);
  }
  &__audio-player-section {
    width: 100%;
    border-top: 1px solid var(--color-text);
    border-bottom: 1px solid var(--color-text);
  }
  &__soundcloud-player-section {
    position: fixed;
    bottom: 0;
    width: 100%;
    border-top: 1px solid var(--color-text);
    background-color: var(--color-bg);
    transition: transform 0.15s ease-in-out, opacity 0.15s ease-in-out;
    padding: 0 0 var(--mid-padding);
    opacity: 0;
    @media screen and (max-width: 1100px) {
      margin-top: var(--base-margin);
      padding: 0 var(--base-padding) var(--base-padding);
    }

    &.is-visible {
      opacity: 1;
    }

    &.is-hidden {
      transform: translateY(
        calc(100% - var(--soundcloud-player-collapsed-height))
      );
    }

    .player-controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--small-padding) 0;
      max-width: var(--page-max-width);
      margin: 0 auto;
      width: 100%;

      .track-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .track-status {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #ccc;

          &.is-playing {
            background-color: #4caf50;
            animation: pulse 1.5s infinite;
          }
        }

        .track-details {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: var(--small-padding);

          .track-source {
            font-weight: 550;
            font-size: var(--base-font-size);
            line-height: 1;
            color: var(--color-text-light, #888);
            @media screen and (max-width: 1100px) {
              display: none;
            }
          }

          .track-title {
            font-weight: 550;
            font-size: var(--base-font-size);
            line-height: 1;
            @media screen and (max-width: 1100px) {
              display: block;
              text-overflow: ellipsis;
              white-space: nowrap;
              overflow: hidden;
            }
          }

          .track-duration {
            font-weight: 550;
            font-size: var(--base-font-size);
            line-height: 1;
            color: var(--color-text-light, #888);
          }
        }
      }

      .player-nav {
        button {
          padding: var(--small-padding) var(--base-padding);
          font-size: var(--small-font-size);
          border: 1px solid transparent;
          border-radius: 100px;
          background-color: var(--color-text);
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.15s;
          color: var(--color-bg);
          letter-spacing: var(--button-letter-spacing);

          &:hover {
            @media (min-width: 1024px) {
              background-color: transparent;
              border: 1px solid var(--color-text);
              color: var(--color-text);
            }
          }
        }
      }
    }
  }
}

.menu-main {
  display: flex;
  flex-flow: row;
  justify-content: center;
  align-items: center;
  @media screen and (max-width: 900px) {
    display: none;
  }

  ul {
    width: 100%;
    max-width: var(--page-max-width);
    @apply flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--base-padding);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  a {
    display: inline-block;
    padding: var(--small-padding) var(--big-padding);
    &:hover {
      text-decoration-color: transparent;
      text-decoration: none;
    }
    &.router-link-active,
    &.parent-active,
    &:hover {
      @media (min-width: 1024px) {
        background-color: var(--color-bg);
        color: var(--color-text);
      }

      &.tag {
        background-color: var(--color-bg);
        color: var(--color-text);
        border: 0.09325rem solid var(--color-bg);
        padding: calc(var(--small-padding)) var(--base-padding);
        font-family: var(--font-text-semibold);

        &.pool {
          color: var(--color-bg);
          border: 0.09325rem solid var(--color-blue);
          background-color: var(--color-blue);
        }

        &.shows {
          color: var(--color-bg);
          border: 0.09325rem solid var(--color-pink);
          background-color: var(--color-pink);
        }

        &.words {
          color: var(--color-bg);
          border: 0.09325rem solid var(--color-green);
          background-color: var(--color-green);
        }
      }
    }

    &.tag {
      background-color: var(--color-bg);
      color: var(--color-bg);
      border: 0.09325rem solid var(--color-bg);
      padding: calc(var(--small-padding)) var(--base-padding);
      font-family: var(--font-text-semibold);

      &.pool {
        color: var(--color-blue);
        border: 0.09325rem solid var(--color-blue);
      }

      &.shows {
        color: var(--color-pink);
        border: 0.09325rem solid var(--color-pink);
      }

      &.words {
        color: var(--color-green);
        border: 0.09325rem solid var(--color-green);
      }
    }
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}
</style>