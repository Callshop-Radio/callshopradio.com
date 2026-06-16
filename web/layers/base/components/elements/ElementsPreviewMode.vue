<script setup>
const _route = useRoute();
const { enabled: previewEnabled, inFrame } = useSanityVisualEditingState();
</script>

<template>
	<a
		v-if="previewEnabled && !inFrame"
		:href="`/preview/disable?redirect=${route.fullPath}`"
		class="preview-toggle"
	>
		<span>Preview Enabled</span>
		<span>Disable Preview</span>
	</a>
</template>

<style lang="postcss" scoped>
.preview-toggle {
  @apply fixed bottom-4 right-4 border-rounded-2 text-xs text-center z-999 bg-yellow-400 p-2 no-underline shadow-sm color-black;

  span {
    @apply first:(block) last:(hidden);
  }

  &:hover {
    @apply bg-red color-white;

    span {
      @apply first:(hidden) last:(block);
    }
  }
}
</style>
