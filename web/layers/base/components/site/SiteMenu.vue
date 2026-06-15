<script setup>
import { useMainStore } from "~/stores/mainStore";

const { locale: _locale, locales: _locales } = useI18n();
const _localePath = useLocalePath();

const mainStore = useMainStore();
const mainMenu = computed(() => mainStore?.siteNav?.mainMenu);
</script>

<template>
	<Transition name="menu-fade">
		<nav v-if="mainStore?.menuOpen" class="menu tags">
			<ul>
				<li v-for="item in mainMenu" :key="item?._key">
					<ElementsLink
						:type="item?.type"
						:href="item?.url"
						:blank="item?.blank"
						:route="item?.route"
						:slug="item?.slug"
						:func="item?.func"
						:class="`tag ${item?.route ? item?.route : ''}`"
					>
						{{ item?.title }}
					</ElementsLink>
				</li>
			</ul>
			<div class="menu__actions">
				<SiteSearchButton />
				<SiteDiscordButton v-if="mainStore?.siteNav?.discordLink" />
				<SiteScheduleButton v-if="mainStore?.siteNav?.schedulePage" />
			</div>
		</nav>
	</Transition>
</template>

<style lang="postcss" scoped>
.menu-fade-enter-active {
  transition: opacity 0.2s ease;
}

.menu-fade-leave-active {
  transition: opacity 0s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}

nav {
  width: 100%;
  height: auto;
  padding: 0 var(--base-padding) var(--base-padding);
  display: flex;
  flex-flow: row;
  justify-content: center;
  align-items: center;
  overflow: hidden;

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
        background-color: var(--color-text);
        color: var(--color-bg);
        border: 0.09325rem solid var(--color-text);
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
      color: var(--color-text);

      border: 0.09325rem solid var(--color-text);
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

/* Mobile: the hamburger menu is the primary nav below 900px */
.menu__actions {
  display: none;
}

@media screen and (max-width: 900px) {
  nav {
    flex-flow: column;
    align-items: stretch;

    ul {
      flex-flow: column;
      align-items: flex-start;
    }
  }

  .menu__actions {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    gap: var(--base-padding);
    width: 100%;
    max-width: var(--page-max-width);
    padding: var(--base-padding) 0 0;
  }
}
</style>
