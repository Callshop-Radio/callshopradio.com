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
});

const placeholderSrc = computed(() => {
  const svgColor = "rgb(230,230,230)";
  return props.svgPlaceholder
    ? `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cropWidth.value} ${cropHeight.value}'%3E%3Crect width='${cropWidth.value}' height='${cropHeight.value}' fill='${svgColor}' /%3E%3C/svg%3E`
    : props.lqipPlaceholder
    ? $urlFor(props.image).width(100).auto(props.auto).fit(props.fit).url()
    : "";
});

const srcSet = computed(() => {
  let srcSet = "";
  const widths = [250, 375, 500, 750, 1000, 1400, 1800, 2400, 3000];
  widths.forEach((width, index) => {
    if (!props.image?.asset) {
      return false;
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
  if (!props.image?.asset?.metadata?.dimensions) return 1920; // Standardwert
  const originalWidth = props.image?.asset?.metadata?.dimensions?.width || 1920;
  const cropLeft = props.image?.crop?.left ?? 0;
  const cropRight = props.image?.crop?.right ?? 0;

  const calculatedWidth =
    originalWidth - cropLeft * originalWidth - cropRight * originalWidth;
  return isNaN(calculatedWidth) ? 1920 : calculatedWidth; // Schutz vor NaN
});

const cropHeight = computed(() => {
  if (!props.image?.asset?.metadata?.dimensions) return 1080; // Standardwert
  const originalHeight =
    props.image?.asset?.metadata?.dimensions?.height || 1080;
  const cropTop = props.image?.crop?.top ?? 0;
  const cropBottom = props.image?.crop?.bottom ?? 0;

  const calculatedHeight =
    originalHeight - cropTop * originalHeight - cropBottom * originalHeight;
  return isNaN(calculatedHeight) ? 1080 : calculatedHeight; // Schutz vor NaN
});

const orientation = computed(() => {
  if (!cropWidth.value || !cropHeight.value) return undefined;

  return cropWidth.value > cropHeight.value
    ? "landscape"
    : cropWidth.value < cropHeight.value
    ? "portrait"
    : "square";
});

const altText = computed(() => props.alt ?? props.image?.asset?.altText);
const isLoaded = ref(false);
const onLoad = () => {
  isLoaded.value = true;
};

const hasValidImage = computed(() => {
  return props.image && props.image.asset;
});

// Emittiere ein Event wenn die Bilddimensionen berechnet sind
const emit = defineEmits(["dimensions"]);

// Dimensions gleich nach Berechnung emittieren
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
  <UnLazyImage
    v-if="hasValidImage"
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
  <div v-else class="image-placeholder" :style="{ aspectRatio: '16/9' }"></div>
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
