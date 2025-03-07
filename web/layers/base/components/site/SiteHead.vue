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
        <ElementsCallshopLogo />
        <ElementsCallshopTextLogo />
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
  padding: 0 0 ;
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
  }
  }
  &__audio-player-section {
    width: 100%;
    border-top: 1px solid var(--color-text);
    border-bottom: 1px solid var(--color-text);
  }
}
</style>