<script setup>
import { useMainStore } from "~/stores/mainStore";

const { locale: _locale, locales: _locales } = useI18n();
const localePath = useLocalePath();

const mainStore = useMainStore();
const _mainMenu = computed(() => mainStore?.siteNav?.mainMenu);

const config = useRuntimeConfig();
const chatEnabled = computed(
	() => import.meta.dev || Boolean(config.public.chatEnabled),
);
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
				<span v-if="chatEnabled" class="icon-tooltip" data-tooltip="Chat">
					<SiteChatButton />
				</span>
				<span
					v-if="mainStore?.siteNav?.schedulePage"
					class="icon-tooltip"
					data-tooltip="Schedule"
				>
					<SiteScheduleButton />
				</span>
				<span class="icon-tooltip" data-tooltip="Konto">
					<SiteAccountButton />
				</span>
				<span class="icon-tooltip" data-tooltip="Menu">
					<SiteMenuButton />
				</span>
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
    /* Match the player row so the two bars read as one unit. */
    height: 56px;
    box-sizing: border-box;
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: center;
    padding: 0;
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
      /* Logo inversion follows the global theme token, so the theme
         switch and the OS setting stay in sync. */
      .logo,
      .text-logo {
        filter: invert(var(--logo-invert));
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
    gap: var(--mid-margin);
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
    gap: var(--mid-margin);
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

    /* Non-tag menu links keep the surface hover. */
    &.router-link-active,
    &.parent-active,
    &:hover {
      @media (min-width: 1024px) {
        background-color: var(--color-bg);
        color: var(--color-text);
      }
    }

    /* Tags are outlined by default; hover and the active page fill them in
       the section accent. */
    &.tag {
      padding: calc(var(--small-padding)) var(--base-padding);
      border: 0.09325rem solid var(--color-text);
      background-color: transparent;
      color: var(--color-text);
      font-family: var(--font-text-semibold);

      &.pool {
        border-color: var(--color-blue);
        color: var(--color-blue);
      }

      &.shows {
        border-color: var(--color-pink);
        color: var(--color-pink);
      }

      &.words {
        border-color: var(--color-green);
        color: var(--color-green);
      }

      @media (min-width: 1024px) {
        &.router-link-active,
        &.parent-active,
        &:hover {
          background-color: var(--color-text);
          border-color: var(--color-text);
          color: var(--color-white);

          &.pool {
            background-color: var(--color-blue);
            border-color: var(--color-blue);
          }

          &.shows {
            background-color: var(--color-pink);
            border-color: var(--color-pink);
          }

          &.words {
            background-color: var(--color-green);
            border-color: var(--color-green);
          }
        }
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
<style lang="postcss" scoped>
.icon-tooltip {
  position: relative;
  display: inline-flex;

  &::after {
    content: attr(data-tooltip);
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 50%;
    z-index: 1000000;
    padding: 0.3125rem 0.5rem;
    border-radius: 6px;
    background-color: var(--color-text);
    color: var(--color-bg);
    font-family: var(--font-text);
    font-size: var(--small-font-size);
    line-height: 1.2;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transform: translate(-50%, -0.25rem);
    transition:
      opacity var(--transition-fast),
      transform var(--transition-fast);
  }

  &:hover::after,
  &:focus-within::after {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

@media (hover: none) {
  .icon-tooltip::after {
    display: none;
  }
}
</style>
