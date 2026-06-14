
<script setup>
import { computed } from "vue";
import { useMainStore } from "@/stores/mainStore";

const mainStore = useMainStore();
const _isDarkMode = computed(() => mainStore?.isDarkMode);

const detectSystemDarkMode = () => {
	mainStore.detectSystemDarkMode();
};

const toggleDarkMode = () => {
	mainStore.toggleDarkMode();
};

onMounted(() => {
	detectSystemDarkMode();
});
</script>
          
<template>
	<div class="darkmodeswitch" @click="toggleDarkMode">
		<svg
			width="24"
			height="15"
			viewBox="0 0 18 11"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle
				class="left"
				cx="5.5"
				cy="5.5"
				r="5.5"
				fill="var(--color-text)" />
			<circle
				class="right"
				cx="12.5"
				cy="5.5"
				r="5"
				fill="var(--color-bg)"
				stroke="var(--color-text)"
			/>
		</svg>
	</div>
</template>
          
<style scoped lang="postcss">
.darkmodeswitch {
  display: inline-flex;
  flex-flow: column wrap;
  justify-content: center;
  align-items: flex-start;
  cursor: pointer;

  svg,
  path {
    fill: var(--color-text);
  }
  svg {
    &.active {
      transform: rotate(180deg);
    }
  }
  &:hover {
    @media (min-width: 1024px) {
      fill: var(--color-pink);
    }
    circle {
      &.left {
        @media (min-width: 1024px) {
          fill: var(--color-pink);
        }
      }
      &.right {
        @media (min-width: 1024px) {
          stroke: var(--color-pink);
        }
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
          