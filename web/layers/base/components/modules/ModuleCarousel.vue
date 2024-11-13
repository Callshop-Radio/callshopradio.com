<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue'
import { useThrottleFn } from '@vueuse/core'

interface Slide {
  _key: string;
	type: 'image' | 'video';
	image: object;
	video?: object;
	videoSettings?: {
		autoplay?: boolean;
		controls?: boolean;
	}
}

const props = defineProps({
	slides: {
		type: Array as () => Slide[],
		default: () => []
	}
})
const [emblaNode, emblaApi] = emblaCarouselVue({
	align: 'start'
})

const emblaContainer = ref<HTMLElement>()

let containerStyle: string

const saveTranslatePositions = useThrottleFn(() => {
	if (!emblaContainer.value) { return }
	containerStyle = emblaContainer.value.style.transform
}, 100)

async function restoreTranslatePositions() {
	if (!emblaContainer.value) { return }
	emblaContainer.value.style.transform = containerStyle
}

onMounted(() => {
	if (emblaApi.value) {
		emblaApi.value.on('scroll', saveTranslatePositions)
		emblaApi.value.on('destroy', restoreTranslatePositions)
	}
})

</script>

<template>
	<div class="module-carousel">
		<div ref="emblaNode" class="embla">
			<div ref="emblaContainer" class="embla__container">
				<div
					v-for="slide in props.slides ?? []"
					:key="slide._key"
					class="embla__slide">
					<!-- Image -->
					<MediaImage
						v-if="slide?.type === 'image' && slide?.image"
						:image="slide?.image"
					/>
					<!-- Video -->
					<MediaVideo
						v-else-if="slide?.type === 'video'"
						:video="slide?.video"
						:autoplay="slide?.videoSettings?.autoplay ?? false"
						:controls="slide?.videoSettings?.controls ?? true"
						:poster-image="slide?.image"
					/>
				</div>
				<ModuleCarouselSlide
					v-for="slide in props.slides ?? []"
					:key="slide._key"
					:data="slide" />
			</div>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.module-carousel {
	@apply mb-4;

	.embla {
		@apply overflow-hidden;

		&__container {
			@apply flex backface-hidden ml-[calc(var(--carousel-spacing)*-1)] touch-pan-y;
		}
		
		&__slide {
			@apply flex flex-grow-0 flex-shrink-0 flex-basis-auto max-w-full min-w-0 pl-[var(--carousel-spacing)] relative;

			:deep(img),
			:deep(.video-wrapper) {
				@apply h-[var(--carousel-height)] max-w-full w-auto;
			}
		}
	}
}
</style>
