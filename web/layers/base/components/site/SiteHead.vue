<script setup>
import { useMainStore } from "~/stores/mainStore";
import ElementsCallshopTextLogo from "../elements/ElementsCallshopTextLogo.vue";

const mainStore = useMainStore();
const mainMenu = computed(() => mainStore?.siteNav?.mainMenu);
// console.log(mainStore);
</script>

<template>
  <div class="header">
    <section class="header__menu-section">
      <div class="header__menu-section__logo">
        <ElementsCallshopLogo class="logo"/>
        <ElementsCallshopTextLogo class="text-logo"/>
      </div>
      <SiteMenu />
    </section>
    <section class="header__audio-player-section">
      <MusicController />
    </section>
  </div>
</template>

<style scoped lang="postcss">
.header {
  position: sticky;
  display: flex;
  flex-flow: column wrap;
  justify-content: flex-start;
  align-items: center;
  top: 0;
  width: 100%;
  margin: var(--big-margin) auto 0;
  padding: 0 0;
  background-color: var(--color-bg);
  z-index: 99999;
  &__menu-section {
    width: 100%;
    max-width: var(--page-max-width);
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: center;
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
      .logo, .text-logo {
        @media (prefers-color-scheme: dark) {
          filter: invert(1);
        }
      }
    }
  }
  &__audio-player-section {
    width: 100%;
    border-top: 1px solid var(--color-text);
    border-bottom: 1px solid var(--color-text);
  }
}
</style>