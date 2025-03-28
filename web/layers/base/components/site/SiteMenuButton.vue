<script setup>
import { useMainStore } from "~/stores/mainStore";
const { locale, locales } = useI18n();
const localePath = useLocalePath();

const mainStore = useMainStore();
const mainMenu = computed(() => mainStore?.siteNav?.mainMenu);
</script>

<template>
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    @click="mainStore?.toggleMenu"
    v-if="!mainStore?.menuOpen"
    class="open"
  >
    stroke="var(--color-text)"
    <circle
      cx="12"
      cy="12"
      r="11.5"
      shape-rendering="geometricPrecision"
      stroke="var(--color-text)"
    />
    <path
      d="M5 8.5H19"
      stroke-linecap="round"
      shape-rendering="optimizeQuality"
      stroke="var(--color-text)"
    />
    <path
      d="M5 12H19"
      stroke-linecap="round"
      shape-rendering="optimizeQuality"
      stroke="var(--color-text)"
    />
    <path
      d="M5 15.5H19"
      stroke-linecap="round"
      shape-rendering="optimizeQuality"
      stroke="var(--color-text)"
    />
  </svg>
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    @click="mainStore?.toggleMenu"
    v-if="mainStore?.menuOpen"
    class="close"
  >
    <circle
      cx="12"
      cy="12"
      r="11.5"
      fill="var(--color-text)"
      stroke="var(--color-text)"
      class="bg"
    />
    <path d="M7 17L17 6.5" stroke="var(--color-bg)" />
    <line
      x1="7.12919"
      y1="6.87106"
      x2="17.1292"
      y2="16.8711"
      stroke="var(--color-bg)"
    />
  </svg>
</template>

<style lang="postcss" scoped>
svg {
  overflow: visible;
  width: 24px;
  height: 24px;
  cursor: pointer;
  @media screen and (max-width: 900px) {
    display: none !important;
  }

  &.open {
    &:hover {
      fill: var(--color-text);
      circle,
      path {
        stroke: var(--color-bg);
      }
    }
  }

  &.close {
    &:hover {
      circle {
        fill: var(--color-bg);
      }
      path,
      line {
        stroke: var(--color-text);
      }
    }
  }

  circle,
  path {
    overflow: visible;
  }
}
</style>
