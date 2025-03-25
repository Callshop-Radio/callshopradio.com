
<template>
    <div class="darkmodeswitch"
        @click="toggleDarkMode"
      >
        <svg
          width="17"
          height="16"
          viewBox="0 0 17 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          :class="{ active: isDarkMode }"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8.23047 16C12.6487 16 16.2305 12.4183 16.2305 8C16.2305 3.58172 12.6487 0 8.23047 0C3.81219 0 0.230469 3.58172 0.230469 8C0.230469 12.4183 3.81219 16 8.23047 16ZM8.23151 14.3332H8.23047V1.66654L8.23151 1.66654C11.7293 1.66654 14.5648 4.50207 14.5648 7.99987C14.5648 11.4977 11.7293 14.3332 8.23151 14.3332Z"
          />
        </svg>
    </div>
  </template>
          
          <script setup>
  import { computed } from "vue";
  import { useMainStore } from "@/stores/mainStore";
  
  const mainStore = useMainStore();
  const isDarkMode = computed(
    () => mainStore?.isDarkMode
  );
  
  const toggleDarkMode = () => {
    mainStore.toggleDarkMode();
  };
  
  </script>
          
<style scoped>
  .darkmodeswitch {
    display: inline-flex;
    flex-flow: column wrap;
    justify-content: center;
    align-items: flex-start;
    cursor: pointer;
    svg,path {
      fill: var(--color-text);
    }
    svg {
      &.active {
          transform: rotate(180deg);
      }
    }
  }
  </style>
          