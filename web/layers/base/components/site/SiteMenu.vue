<script setup>
import { useMainStore } from "~/stores/mainStore";
const { locale, locales } = useI18n();
const localePath = useLocalePath();

const mainStore = useMainStore();
const mainMenu = computed(() => mainStore?.siteNav?.mainMenu);
</script>

<template>
  <Transition name="menu-fade">
    <nav class="menu tags" v-if="mainStore?.menuOpen">
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
    </nav>
  </Transition>
</template>

<style lang="postcss" scoped>
.menu-fade-enter-active {
  transition: opacity 0.3s ease;
}

.menu-fade-leave-active {
  transition: opacity 0s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}

nav {
  background-color: var(--color-text);
  width: 100%;
  height: auto;
  padding: var(--base-padding) 0;
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
    gap: var(--mid-margin);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  a {
    display: inline-block;
    padding: 0.5rem 1rem;
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
        padding: calc(var(--small-padding) / 2) var(--small-padding);
        font-size: var(--base-font-size);

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
      background-color: var(--color-text);
      color: var(--color-bg);
      border: 0.09325rem solid var(--color-bg);
      padding: calc(var(--small-padding) / 2) var(--small-padding);
      font-size: var(--base-font-size);

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
</style>
