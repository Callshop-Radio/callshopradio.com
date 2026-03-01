<script setup lang="ts">
import { computed } from 'vue'
import { useMainStore } from '~/stores/mainStore'

const mainStore = useMainStore()

// Computed property für den aktuellen Kanalstatus
const _isChannelOne = computed(() => {
	return mainStore.activeScheduleLocation === 'channelOne'
})
</script>

<template>
	<div class="location-switch">
		<button
			:class="[
				'location-switch__btn',
				{
					'location-switch__btn--active':
						mainStore.activeStreamingChannel === 'channelOne',
				},
			]"
			@click="mainStore.setActiveStreamingChannel('channelOne')"
		>
			1
		</button>
		<button
			:class="[
				'location-switch__btn',
				{
					'location-switch__btn--active':
						mainStore.activeStreamingChannel === 'channelTwo',
				},
			]"
			@click="mainStore.setActiveStreamingChannel('channelTwo')"
		>
			2
		</button>
	</div>
</template>

<style scoped lang="postcss">
.location-switch {
  display: flex;
  border-radius: 24px;
  background-color: var(--color-grey);
  padding: 2px;
  overflow: hidden;
  width: fit-content;
  pointer-events: none;
}

.location-switch__btn {
  padding: 3px 10px;
  background: transparent;
  border: none;
  font-size: var(--small-font-size);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;
  border-radius: 20px;
  position: relative;
  color: var(--color-text);
  text-decoration: none !important;
  text-decoration-thickness: 0;
  pointer-events: all;
  color: var(--color-black);
}

.location-switch__btn--active {
  background-color: var(--color-pink);
  color: var(--color-white);
}

.location-switch__btn:focus {
  outline: none;
}

.location-switch__btn:hover:not(.location-switch__btn--active) {
  background-color: var(--color-grey);
}

</style>