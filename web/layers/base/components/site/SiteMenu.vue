<script setup lang="ts">
import { useMainStore } from "~/stores/mainStore";

const { locale: _locale, locales: _locales, locale } = useI18n();
const localePath = useLocalePath();

const mainStore = useMainStore();

// The menu comes from Sanity. Legal notice and privacy now live on one page,
// so the privacy entry is dropped and the legal entry points at /legal.
const menuItems = computed(() => {
	const items = Array.isArray(mainStore?.siteNav?.mainMenu)
		? mainStore.siteNav.mainMenu
		: [];
	const isDe = locale.value === "de";

	return items
		.filter((item) => !String(item?.path ?? "").includes("privacy"))
		.map((item) => {
			if (String(item?.path ?? "") === "/legal-notice") {
				return {
					...item,
					path: "/legal",
					title: isDe ? "Impressum & Datenschutz" : "Legal & Privacy",
				};
			}
			return item;
		});
});
</script>

<template>
	<div class="menu-shell" :class="{ 'is-open': mainStore?.menuOpen }">
		<nav class="menu tags" :aria-hidden="!mainStore?.menuOpen">
			<div class="menu__primary">
				<NuxtLink :to="localePath('/shows')" class="tag shows">Shows</NuxtLink>
				<NuxtLink :to="localePath('/pool')" class="tag pool">Pool</NuxtLink>
				<NuxtLink :to="localePath('/words')" class="tag words">Words</NuxtLink>
			</div>
			<div class="menu__row">
				<ul>
					<li v-for="item in menuItems" :key="item?._key">
						<ElementsLink
							:type="item?.type"
							:path="item?.path"
							:href="item?.url"
							:blank="item?.blank"
							:route="item?.route"
							:slug="item?.slug"
							:parent-slug="item?.parentSlug"
							:set-slug="item?.setSlug"
							:ref-type="item?.refType"
							:func="item?.func"
							:class="`tag ${item?.route ? item?.route : ''}`"
						>
							{{ item?.title }}
						</ElementsLink>
					</li>
				</ul>
				<div class="menu__theme">
					<SiteDarkMode />
				</div>
			</div>
		</nav>
	</div>
</template>

<style lang="postcss" scoped>
/* Animated expand: the grid row goes from 0fr to 1fr, the content fades in.
   `visibility` keeps the closed links out of the tab order. */
.menu-shell {
  display: grid;
  width: 100%;
  grid-template-rows: 0fr;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  overflow: hidden;
  transition:
    grid-template-rows 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.26s ease,
    visibility 0s linear 0.38s;

  &.is-open {
    grid-template-rows: 1fr;
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition-delay: 0s;
  }

  &:not(.is-open) nav {
    padding-bottom: 0;
  }
}

nav {
  position: relative;
  width: 100%;
  height: auto;
  min-height: 0;
  padding: 0 var(--base-padding) var(--base-padding);
  display: flex;
  flex-flow: row;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  transition: padding-bottom 0.3s ease;

  ul {
    width: auto;
    max-width: 100%;
    @apply flex;
    flex-flow: row wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--mid-margin);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .menu__row {
    position: relative;
    display: flex;
    align-items: center;
    width: max-content;
    max-width: 100%;
    margin: 0 auto;
  }

  /* The theme switch sits outside the item flow so the menu links keep their
     exact position when it is added. */
  .menu__theme {
    position: absolute;
    top: 50%;
    left: calc(100% + var(--mid-margin));
    width: max-content;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
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

/* The Shows/Pool/Words quick-links live in the header on desktop; on mobile
   they move into the opened menu as the first row. */
.menu__primary {
  display: none;
}

@media screen and (max-width: 900px) {
  nav {
    flex-flow: column;
    align-items: stretch;
    gap: var(--base-padding);

    ul {
      flex-flow: row wrap;
      justify-content: flex-start;
      gap: var(--base-padding);
    }

    .menu__row {
      width: 100%;
      flex-wrap: wrap;
    }

    .menu__theme {
      position: static;
      transform: none;
      margin-left: var(--small-padding);
    }
  }

  .menu__primary {
    display: flex;
    flex-flow: row wrap;
    align-items: center;
    gap: var(--mid-padding);
    width: 100%;
    max-width: var(--page-max-width);
  }
}

@media (prefers-reduced-motion: reduce) {
  .menu-shell {
    transition: none;
  }
}
</style>
