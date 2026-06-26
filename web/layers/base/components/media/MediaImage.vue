<script setup>
const { $urlFor } = useNuxtApp();

const props = defineProps({
	expand: {
		type: Number,
		default: undefined,
	},
	image: {
		type: Object,
		default: () => undefined,
	},

	svgPlaceholder: {
		type: Boolean,
		default: () => false,
	},
	lqipPlaceholder: {
		type: Boolean,
		default: () => true,
	},
	dataSizes: {
		type: String,
		default: () => "auto",
	},
	dataParentFit: {
		type: String,
		default: () => "",
	},
	alt: {
		type: String,
		default: "",
	},
	auto: {
		default: "format",
		type: String,
	},
	fit: {
		default: "max",
		type: String,
	},
	preload: {
		type: Boolean,
		default: () => false,
	},
	eager: {
		type: Boolean,
		default: () => false,
	},
});

const placeholderSrc = computed(() => {
	const svgColor = "rgb(230,230,230)";
	if (props.svgPlaceholder) {
		return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cropWidth.value} ${cropHeight.value}'%3E%3Crect width='${cropWidth.value}' height='${cropHeight.value}' fill='${svgColor}' /%3E%3C/svg%3E`;
	}
	if (props.lqipPlaceholder) {
		return props.image?.asset?.metadata?.lqip ?? "";
	}
	return "";
});

const srcSet = computed(() => {
	let srcSet = "";
	const widths = [400, 750, 1200, 1800, 2400];
	widths.forEach((width, index) => {
		if (!props.image?.asset) {
			return;
		}
		srcSet +=
			$urlFor(props.image).width(width).auto(props.auto).fit(props.fit) +
			` ${width}w`;
		if (index + 1 !== widths.length) {
			srcSet += ",";
		}
		srcSet += " ";
	});
	return srcSet;
});

const cropWidth = computed(() => {
	if (!props.image?.asset?.metadata?.dimensions) return 1920; // Default value
	const originalWidth = props.image?.asset?.metadata?.dimensions?.width || 1920;
	const cropLeft = props.image?.crop?.left ?? 0;
	const cropRight = props.image?.crop?.right ?? 0;

	const calculatedWidth =
		originalWidth - cropLeft * originalWidth - cropRight * originalWidth;
	return Number.isNaN(calculatedWidth) ? 1920 : calculatedWidth; // Protection against NaN
});

const cropHeight = computed(() => {
	if (!props.image?.asset?.metadata?.dimensions) return 1080; // Default value
	const originalHeight =
		props.image?.asset?.metadata?.dimensions?.height || 1080;
	const cropTop = props.image?.crop?.top ?? 0;
	const cropBottom = props.image?.crop?.bottom ?? 0;

	const calculatedHeight =
		originalHeight - cropTop * originalHeight - cropBottom * originalHeight;
	return Number.isNaN(calculatedHeight) ? 1080 : calculatedHeight; // Protection against NaN
});

const orientation = computed(() => {
	if (!cropWidth.value || !cropHeight.value) return undefined;

	return cropWidth.value > cropHeight.value
		? "landscape"
		: cropWidth.value < cropHeight.value
			? "portrait"
			: "square";
});

// Default `src` for the eager <img> branch — the browser picks the best
// match from srcset, this is just the legacy fallback.
const defaultSrc = computed(() => {
	if (!props.image?.asset) return undefined;
	return String(
		$urlFor(props.image).width(1200).auto(props.auto).fit(props.fit),
	);
});

const altText = computed(() => props.alt ?? props.image?.asset?.altText);
const isLoaded = ref(false);
const onLoad = () => {
	isLoaded.value = true;
};

const hasValidImage = computed(() => {
	return props.image?.asset;
});

// Emit an event when the image dimensions are calculated
const emit = defineEmits(["dimensions"]);

// Emit dimensions right after calculation
watchEffect(() => {
	if (cropWidth.value && cropHeight.value) {
		emit("dimensions", {
			width: cropWidth.value,
			height: cropHeight.value,
		});
	}
});
</script>

<template>
	<!-- Eager LCP path: plain <img> with native eager loading + priority.
	     Bypasses UnLazyImage because combining loading="eager" with UnLazy
	     leaves the <img> stuck on its LQIP placeholder (UnLazy keeps the real
	     URL in data-srcset and never promotes it to srcset). -->
	<img
		v-if="hasValidImage && props.eager"
		:src="defaultSrc"
		:srcset="srcSet"
		sizes="100vw"
		:alt="altText"
		:width="cropWidth"
		:height="cropHeight"
		:class="[orientation, 'loaded']"
		:style="{ aspectRatio: `${cropWidth} / ${cropHeight}` }"
		loading="eager"
		fetchpriority="high"
		draggable="false"
		@load="onLoad"
	>
	<UnLazyImage
		v-else-if="hasValidImage"
		:style="{ aspectRatio: `${cropWidth} / ${cropHeight}` }"
		:placeholder-src="placeholderSrc"
		:src-set="srcSet"
		:auto-sizes="true"
		:alt="altText"
		:width="cropWidth"
		:height="cropHeight"
		:class="[orientation, { loaded: isLoaded }]"
		:preload="props.preload"
		draggable="false"
		:lazy-load="true"
		class="fade"
		@load="onLoad"
	/>
	<div
		v-else
		class="image-placeholder"
		:style="{ aspectRatio: '16/9' }"/>
</template>

<style lang="postcss" scoped>
.fade {
  @apply opacity-0;

  &.loaded {
    @apply opacity-100 transition-opacity duration-400;
  }
}
.image-placeholder {
  width: 100%;
  min-height: 300px;
  background-color: rgba(0, 0, 0, 0.1);
}

img {
  -webkit-user-select: none ;
  -khtml-user-select: none ;
  -moz-user-select: none ;
  -o-user-select: none ;
  user-select: none ;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}
</style>
