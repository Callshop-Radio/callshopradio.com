<script setup>
import "plyr/dist/plyr.css";
// import Plyr from 'plyr'
import { useIntersectionObserver } from "@vueuse/core";

const Plyr = import.meta.client
	? await import("plyr").then((m) => m.default)
	: null;

const props = defineProps({
	video: {
		type: Object,
		required: true,
	},
	posterImage: {
		type: Object,
		default: () => undefined,
	},
	showTime: {
		type: Boolean,
		default: () => false,
	},
	preferMp4: {
		type: Boolean,
		default: () => true,
	},
	useSmallResolution: {
		type: Boolean,
		default: () => false,
	},
	autoplay: {
		type: Boolean,
		default: () => false,
	},
	controls: {
		type: Boolean,
		default: () => true,
	},
});

const videoEl = ref(null);
const player = ref(null);
const isVisible = ref(false);

const isLoaded = ref(false);

useIntersectionObserver(
	videoEl,
	([{ isIntersecting }]) => {
		isVisible.value = isIntersecting;
		if (isIntersecting && player.value) {
			if (props.autoplay) {
				player?.value?.play();
			}
		} else {
			setTimeout(() => {
				player?.value?.pause();
			}, 100);
		}
	},
	{
		threshold: 0.0,
	},
);

const videoWidth = computed(() => {
	const videoTrack = props.video?.asset?.data?.tracks?.find(
		(el) => el.type === "video",
	);
	return videoTrack ? videoTrack.max_width : undefined;
});
const videoHeight = computed(() => {
	const videoTrack = props.video?.asset?.data?.tracks?.find(
		(el) => el.type === "video",
	);
	return videoTrack ? videoTrack.max_height : undefined;
});
const aspectRatioStyle = computed(() =>
	videoWidth.value && videoHeight
		? { "aspect-ratio": `${videoWidth.value} / ${videoHeight.value}` }
		: {},
);

const { $urlFor } = useNuxtApp();
const posterSrc = computed(() => {
	if (props.posterImage) {
		return $urlFor(props.posterImage)
			.width(videoWidth.value ?? 1920)
			.url();
	} else {
		return props.video?.asset?.playbackId
			? `https://image.mux.com/${
					props.video?.asset?.playbackId
				}/thumbnail.jpg?time=${props.video?.asset?.thumbTime ?? 0}`
			: "";
	}
});

const { appendVideo } = useMuxStream({
	muxVideo: props.video,
	videoEl: videoEl,
	preferMp4: props.preferMp4,
	useSmallResolution: props.useSmallResolution,
});

onMounted(() => {
	if (appendVideo && videoEl.value) {
		appendVideo();
		player.value = new Plyr(videoEl.value, {
			loop: { active: props?.autoplay },
			clickToPlay: !props?.autoplay,
			fullscreen: {
				enabled: !props?.autoplay,
				fallback: !props?.autoplay,
				iosNative: false,
				container: null,
			},
			storage: false,
			controls: props?.controls
				? props?.autoplay
					? ["play-large", "play", "progress", "mute", "fullscreen"]
					: ["play-large", "play", "progress", "fullscreen"]
				: !props?.autoplay
					? ["play-large"]
					: false,
		});

		player.value.on("ready", () => {
			isLoaded.value = true;
			if (props.autoplay) {
				player.value.muted = true;
			}
			if (isVisible.value && props.autoplay) {
				player.value.play();
			}
		});
	}
});
</script>

<template>
	<div
		class="video-wrapper"
		:class="{ loaded: isLoaded }"
		:style="aspectRatioStyle"
	>
		<video
			ref="videoEl"
			class="video"
			:poster="!props.autoplay ? posterSrc : undefined"
			:width="videoWidth"
			:height="videoHeight"
			:style="aspectRatioStyle"
			playsinline
			preload="metadata"
			crossorigin="anonymous"
		/>
	</div>
</template>

<style lang="postcss" scoped>
.video-wrapper {
  --plyr-color-main: white;
  --plyr-video-control-background-hover: transparent;

  opacity: 0;
  transition: opacity var(--transition-normal);
  width: 100%;
  height: auto;

  &.loaded {
    opacity: 1;
  }
}
</style>
