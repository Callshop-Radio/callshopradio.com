<script setup>
import { useMainStore } from "~/stores/mainStore";

const { locale: _locale, locales: _locales } = useI18n();
const localePath = useLocalePath();

const mainStore = useMainStore();
const _mainMenu = computed(() => mainStore?.siteNav?.mainMenu);
</script>

<template>
	<div class="header">
		<section class="header__title-section">
			<NuxtLink :to="localePath('/')" class="header__title-section__logo">
				<div class="header__title-section__logo">
					<ElementsCallshopLogo class="logo" />
					<ElementsCallshopTextLogo class="text-logo" />
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
						<NuxtLink :to="localePath('/words')" :class="`tag words`">
							Words
						</NuxtLink>
					</ul>
				</nav>
				<SiteSearchButton />
				<SiteDiscordButton v-if="mainStore?.siteNav?.discordLink" />
				<SiteScheduleButton v-if="mainStore?.siteNav?.schedulePage" />
				<SiteMenuButton />
			</div>
		</section>
		<SiteMenu />
		<section class="header__audio-player-section">
			<SitePlayer />
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
  z-index: 999999;
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
    &__logo {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--small-padding);
      h1 {
        font-family: var(--font-text);
      }
      /* Logo inversion in dark mode */
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