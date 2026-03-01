<script setup>
import { useMainStore } from '~/stores/mainStore'
const { locale: _locale, locales: _locales } = useI18n()
const _localePath = useLocalePath()

const mainStore = useMainStore()
const _mainMenu = computed(() => mainStore?.siteNav?.mainMenu)
</script>

<template>
	<svg
		v-if="!mainStore?.menuOpen"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class="open"
		@click="mainStore?.toggleMenu"
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
		v-if="mainStore?.menuOpen"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		class="close"
		@click="mainStore?.toggleMenu"
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
  width: calc(var(--base-font-size) + var(--small-padding) * 2);
  height: calc(var(--base-font-size) + var(--small-padding) * 2);
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
