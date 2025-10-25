<script setup>
const props = defineProps({
	type: {
		type: String,
		default: 'image',
		validator(value) {
			return ['image', 'video'].includes(value)
		}
	},
	image: {
		type: Object,
		default: () => undefined
	},
	video: {
		type: Object,
		default: () => undefined
	},
	videoSettings: {
		type: Object,
		default: () => undefined
	},
	caption: {
		type: String,
		default: ''
	}
})
</script>

<template>
	<div class="module-media">
		<figure>
			<!-- Image -->
			<MediaImage
				v-if="props.type === 'image' && props.image"
				:image="props.image"
			/>
			<!-- Video -->
			<MediaVideo
				v-else-if="props.type === 'video'"
				:video="props.video"
				:autoplay="props.videoSettings?.autoplay ?? false"
				:controls="props.videoSettings?.controls ?? true"
				:poster-image="props.image"
			/>
			<figcaption v-if="props.caption">
				{{ props.caption }}
			</figcaption>
		</figure>
	</div>
</template>

<style lang="postcss" scoped>
.module-media {
	@apply mb-0;

  figure {
		@apply mb-4 max-w-80ch;
  }
}
</style>
