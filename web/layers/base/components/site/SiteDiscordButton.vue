<script setup>
import { useMainStore } from '~/stores/mainStore'
const { locale: _locale, locales: _locales } = useI18n()
const _localePath = useLocalePath()

const mainStore = useMainStore()
const _mainMenu = computed(() => mainStore?.siteNav?.mainMenu)
</script>

<template>
	<NuxtLink :to="`${mainStore?.siteNav?.discordLink}`" target="_blank">
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle
				cx="12"
				cy="12"
				r="11.5"
				stroke="var(--color-text)" />
			<path
				d="M9.33459 19C9.28538 19 9.23557 18.99 9.18752 18.9689C9.04397 18.9059 8.95081 18.757 8.95081 18.5919V16.7235H8.94495C7.32135 16.7235 6 15.3186 6 13.5921V10.1313C6 8.40497 7.32129 7 8.94495 7H15.055C16.6786 7 18 8.40491 18 10.1313V13.5921C18 15.3185 16.6787 16.7235 15.055 16.7235H11.6355L9.60645 18.8803C9.53321 18.9582 9.43478 18.9999 9.33516 18.9999L9.33459 19ZM8.94494 7.81686C7.74436 7.81686 6.76814 8.85543 6.76814 10.1314V13.5922C6.76814 14.8688 7.74489 15.9068 8.94494 15.9068H9.33518C9.54729 15.9068 9.71897 16.0893 9.71897 16.3149V17.6058L11.2049 16.0258C11.277 15.9492 11.3748 15.9062 11.4762 15.9062H15.0544C16.255 15.9062 17.2312 14.8676 17.2312 13.5916V10.1308C17.2312 8.85425 16.2545 7.81625 15.0544 7.81625L8.94494 7.81686ZM14.8782 13.4645H9.12194C8.90983 13.4645 8.73815 13.282 8.73815 13.0564C8.73815 12.8309 8.90983 12.6483 9.12194 12.6483H14.8776C15.0897 12.6483 15.2614 12.8309 15.2614 13.0564C15.2614 13.282 15.0897 13.4645 14.8776 13.4645H14.8782ZM14.8782 11.0758H9.12194C8.90983 11.0758 8.73815 10.8932 8.73815 10.6677C8.73815 10.4422 8.90983 10.2596 9.12194 10.2596H14.8776C15.0897 10.2596 15.2614 10.4422 15.2614 10.6677C15.2614 10.8932 15.0897 11.0758 14.8776 11.0758H14.8782Z"
				fill="var(--color-text)"
			/>
		</svg>
	</NuxtLink>
</template>

<style lang="postcss" scoped>
svg {
  overflow: visible;
  width: calc(var(--base-font-size) + var(--small-padding) * 2);
  height: calc(var(--base-font-size) + var(--small-padding) * 2);
  cursor: pointer;

  circle,
  path {
    overflow: visible;
  }
  &:hover {
    @media (min-width: 1024px) {
      fill: var(--color-pink);
    }
    circle {
      @media (min-width: 1024px) {
        stroke: var(--color-pink);
      }
    }
    path {
      @media (min-width: 1024px) {
        fill: var(--color-bg);
      }
    }
  }
}
</style>
