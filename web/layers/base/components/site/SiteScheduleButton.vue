<script setup>
import { useMainStore } from "~/stores/mainStore";
const { locale, locales } = useI18n();
const localePath = useLocalePath();

const mainStore = useMainStore();
const mainMenu = computed(() => mainStore?.siteNav?.mainMenu);
</script>

<template>
  <NuxtLink :to="localePath(`/${mainStore?.siteNav?.schedulePageRoute}`)">
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="11.5" stroke="var(--color-text)" />
      <path
        d="M16.7143 6.91667H15.4286V6.45833C15.4286 6.20624 15.2357 6 15 6C14.7643 6 14.5714 6.20624 14.5714 6.45833V6.91667H9.42857V6.45833C9.42857 6.20624 9.23572 6 9 6C8.76428 6 8.57143 6.20624 8.57143 6.45833V6.91667H7.28571C6.57858 6.91667 6 7.53542 6 8.29167V15.625C6 16.3812 6.57858 17 7.28571 17H16.7143C17.4214 17 18 16.3812 18 15.625V8.29167C18 7.53542 17.4214 6.91667 16.7143 6.91667ZM6.85714 8.29167C6.85714 8.03958 7.04999 7.83333 7.28571 7.83333H8.57143V8.29167C8.57143 8.54376 8.76428 8.75 9 8.75C9.23572 8.75 9.42857 8.54376 9.42857 8.29167V7.83333H14.5714V8.29167C14.5714 8.54376 14.7643 8.75 15 8.75C15.2357 8.75 15.4286 8.54376 15.4286 8.29167V7.83333H16.7143C16.95 7.83333 17.1429 8.03958 17.1429 8.29167V9.66667H6.85714V8.29167ZM17.1429 15.625C17.1429 15.8771 16.95 16.0833 16.7143 16.0833H7.28571C7.04999 16.0833 6.85714 15.8771 6.85714 15.625V10.5833H17.1429V15.625Z"
        fill="var(--color-text)"
      />
    </svg>
  </NuxtLink>
</template>

<style lang="postcss" scoped>
svg {
  overflow: visible;
  width: 24px;
  height: 24px;
  cursor: pointer;

  circle,
  path {
    overflow: visible;
  }
  &:hover {
    fill: var(--color-pink);
    circle {
      stroke: var(--color-pink);
    }
    path {
        fill: var(--color-bg);
    }
  }
}

.router-link-active {
  svg {
    fill: var(--color-pink);
    circle {
      stroke: var(--color-pink);
    }
    path {
        fill: var(--color-bg);
    }
  }
}
</style>
