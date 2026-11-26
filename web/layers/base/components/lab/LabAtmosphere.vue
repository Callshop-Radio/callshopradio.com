<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { applyFormWormPath } from "../../composables/useFormWorm";
import {
	type FormPoint,
	formSeedFor,
	generateForm,
} from "../../utils/generative-form";

type BackgroundVariant = "horizon" | "strata" | "form";
type LabPage = "shows" | "pool" | "words";

const props = withDefaults(
	defineProps<{
		variant: BackgroundVariant;
		page: LabPage;
		accent: string;
		shift?: number;
		px?: number;
		py?: number;
		dark?: boolean;
		formSeed?: number | null;
		contained?: boolean;
		foregroundWorm?: boolean;
	}>(),
	{
		shift: 0,
		px: 0,
		py: 0,
		dark: false,
		formSeed: null,
		contained: false,
		foregroundWorm: false,
	},
);

const shiftX = computed(() =>
	props.page === "pool" ? 0 : Math.round(props.shift * 3),
);
const shiftY = computed(() =>
	props.page === "pool" ? Math.round(props.shift * 5) : 0,
);

const FORM_VIEW_BOX = "0 0 1000 1000";
const SAMPLE_COUNT = 256;
const FRAME_MARGIN = 40;
const MORPH_MS = 800;
const WORM_MS = 15_000;
const WORM_FRACTION = 0.06794;

const formSampler = ref<SVGPathElement | null>(null);
const formPathEl = ref<SVGPathElement | null>(null);
const formWormEl = ref<SVGPathElement | null>(null);
const formCache = new Map<string, FormPoint[]>();
let currentPoints: FormPoint[] | null = null;
let morphFrame = 0;
let wormFrame = 0;
let wormStart = 0;
let morphFrom: FormPoint[] = [];
let morphTarget: FormPoint[] = [];
let morphStart = 0;

function pointsToPath(points: FormPoint[], closed = true) {
	if (!points.length) return "";
	const commands = points.map(([x, y], index) => {
		const command = index === 0 ? "M" : "L";
		return `${command} ${x.toFixed(1)} ${y.toFixed(1)}`;
	});
	return `${commands.join(" ")}${closed ? " Z" : ""}`;
}

function sampleForm(path: string, viewBox: string): FormPoint[] {
	const sampler = formSampler.value;
	if (!sampler) return [];

	sampler.setAttribute("d", path);
	const length = sampler.getTotalLength();
	const [minX = 0, minY = 0, width = 1, height = 1] = viewBox
		.split(/\s+/)
		.map(Number);

	const frame = 1000 - FRAME_MARGIN * 2;
	const scale = Math.min(frame / width, frame / height);
	const offsetX = (1000 - width * scale) / 2 - minX * scale;
	const offsetY = (1000 - height * scale) / 2 - minY * scale;

	const points: FormPoint[] = [];
	for (let index = 0; index < SAMPLE_COUNT; index++) {
		const point = sampler.getPointAtLength((length * index) / SAMPLE_COUNT);
		points.push([point.x * scale + offsetX, point.y * scale + offsetY]);
	}
	return points;
}

function alignPoints(from: FormPoint[], to: FormPoint[]) {
	const count = to.length;
	if (!from.length || from.length !== count) return to;

	const score = (offset: number) => {
		let total = 0;
		for (let index = 0; index < count; index += 8) {
			const a = from[index];
			const b = to[(index + offset) % count];
			if (!a || !b) continue;
			const dx = a[0] - b[0];
			const dy = a[1] - b[1];
			total += dx * dx + dy * dy;
		}
		return total;
	};

	let bestOffset = 0;
	let bestScore = Number.POSITIVE_INFINITY;
	for (let offset = 0; offset < count; offset += 8) {
		const value = score(offset);
		if (value < bestScore) {
			bestScore = value;
			bestOffset = offset;
		}
	}
	for (let offset = bestOffset - 7; offset <= bestOffset + 7; offset++) {
		if (offset < 0) continue;
		const value = score(offset);
		if (value < bestScore) {
			bestScore = value;
			bestOffset = offset;
		}
	}

	return to.slice(bestOffset).concat(to.slice(0, bestOffset));
}

function wormPath(points: FormPoint[], phase: number) {
	if (points.length < 2) return "";

	const count = points.length;
	const span = WORM_FRACTION * count;
	const steps = Math.max(2, Math.ceil(span * 2));
	const start = (((phase % 1) + 1) % 1) * count;
	const commands: string[] = [];

	for (let index = 0; index <= steps; index++) {
		const position = start + (span * index) / steps;
		const base = Math.floor(position);
		const t = position - base;
		const a = points[((base % count) + count) % count];
		const b = points[(((base + 1) % count) + count) % count];
		if (!a || !b) continue;
		const x = a[0] + (b[0] - a[0]) * t;
		const y = a[1] + (b[1] - a[1]) * t;
		commands.push(`${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
	}

	return commands.join(" ");
}

let wormReduced = false;

function updateWorm(now: number) {
	if (!currentPoints?.length) return;
	const progress = wormReduced ? 0.25 : ((now - wormStart) % WORM_MS) / WORM_MS;
	// Match the previous direction: the worm moves against the point order.
	const phase = 1 - progress;
	const path = wormPath(currentPoints, phase);
	formWormEl.value?.setAttribute("d", path);
	// The foreground copy above the cards shares this exact geometry.
	applyFormWormPath(path);
}

function startWorm() {
	wormReduced =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	wormStart = performance.now();
	if (wormFrame) cancelAnimationFrame(wormFrame);
	if (wormReduced) {
		updateWorm(wormStart);
		return;
	}

	const tick = (now: number) => {
		updateWorm(now);
		wormFrame = requestAnimationFrame(tick);
	};
	wormFrame = requestAnimationFrame(tick);
}

function renderPoints(points: FormPoint[]) {
	currentPoints = points;
	formPathEl.value?.setAttribute("d", pointsToPath(points));
	updateWorm(performance.now());
}

function formPointsFor(shift: number) {
	if (!props.formSeed) return [];
	const key = `${props.formSeed}:${shift}`;
	const cached = formCache.get(key);
	if (cached) return cached;

	const seed = formSeedFor(props.formSeed, shift);
	const form = generateForm(seed);
	const points = sampleForm(form.path, form.viewBox);
	formCache.set(key, points);
	return points;
}

function morphTo(target: FormPoint[]) {
	if (!currentPoints) {
		renderPoints(target);
		return;
	}

	const reduceMotion =
		typeof window !== "undefined" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	if (reduceMotion) {
		renderPoints(target);
		return;
	}

	morphFrom = currentPoints.map(([x, y]) => [x, y] as FormPoint);
	morphTarget = alignPoints(currentPoints, target);
	morphStart = performance.now();
	if (morphFrame) cancelAnimationFrame(morphFrame);

	const tick = (now: number) => {
		const progress = Math.min(1, (now - morphStart) / MORPH_MS);
		// Ease out: the first frame already moves, so the morph starts on the
		// click instead of easing in silently.
		const eased = 1 - (1 - progress) ** 3;
		const points = morphFrom.map((from, index) => {
			const to = morphTarget[index] ?? from;
			return [
				from[0] + (to[0] - from[0]) * eased,
				from[1] + (to[1] - from[1]) * eased,
			] as FormPoint;
		});
		currentPoints = points;
		formPathEl.value?.setAttribute("d", pointsToPath(points));
		if (progress < 1) {
			morphFrame = requestAnimationFrame(tick);
		} else {
			morphFrame = 0;
			renderPoints(morphTarget);
		}
	};
	morphFrame = requestAnimationFrame(tick);
}

watch(
	[() => props.variant, () => props.formSeed, () => props.shift],
	async () => {
		if (props.variant !== "form" || !props.formSeed) {
			if (morphFrame) cancelAnimationFrame(morphFrame);
			morphFrame = 0;
			return;
		}

		if (!formSampler.value || !formPathEl.value) {
			await nextTick();
			if (!formSampler.value) return;
		}

		const points = formPointsFor(props.shift);
		if (points.length) morphTo(points);
	},
	{ immediate: true },
);

onMounted(() => {
	startWorm();
});

onUnmounted(() => {
	if (morphFrame) cancelAnimationFrame(morphFrame);
	if (wormFrame) cancelAnimationFrame(wormFrame);
});
</script>

<template>
	<div
		class="lab-atmosphere"
		:class="[
			`lab-atmosphere--${variant}`,
			{
				'is-contained': contained,
				'is-dark': dark,
				'is-foreground-worm': foregroundWorm,
			},
		]"
		:data-page="page"
		:style="{
			'--accent': accent,
			'--lab-shift-x': `${shiftX}px`,
			'--lab-shift-y': `${shiftY}px`,
			'--lab-px': `${px}px`,
			'--lab-py': `${py}px`,
		}"
		aria-hidden="true"
	>
		<div class="lab-atmosphere__parallax">
			<!-- 01 — Horizon: broad field, cropped disc, one hairline. -->
			<template v-if="variant === 'horizon'">
				<div class="horizon-field" />
				<div class="horizon-disc">
					<span class="horizon-disc__ring" />
				</div>
				<div class="horizon-line horizon-line--a" />
				<div class="horizon-line horizon-line--b" />
			</template>

			<!-- 02 — Strata: offset planes with edges and a cut seam. -->
			<template v-else-if="variant === 'strata'">
				<div class="strata-plane strata-plane--a">
					<span class="strata-seam" />
				</div>
				<div class="strata-plane strata-plane--b">
					<span class="strata-seam" />
				</div>
				<div class="strata-plane strata-plane--c">
					<span class="strata-seam" />
				</div>
			</template>

			<!-- 03 — Form: a generated contour that morphs on every slide. -->
			<template v-else>
				<svg
					class="form-shape"
					:viewBox="FORM_VIEW_BOX"
					preserveAspectRatio="xMidYMid meet"
					xmlns="http://www.w3.org/2000/svg"
				>
					<!-- Start page: 3 units × (575 / 1113) = 1.55 px line;
					     50 units → 25.83 px worm. -->
					<path
						ref="formPathEl"
						class="form-line"
						fill="none"
						stroke="currentColor"
						stroke-width="1.55"
						stroke-linecap="round"
						stroke-linejoin="round"
						vector-effect="non-scaling-stroke"
					/>
					<path
						ref="formWormEl"
						class="form-worm"
						fill="none"
						stroke="currentColor"
						stroke-width="25.83"
						stroke-linecap="round"
						stroke-linejoin="round"
						vector-effect="non-scaling-stroke"
					/>
				</svg>
			</template>
		</div>

		<svg class="form-sampler" xmlns="http://www.w3.org/2000/svg">
			<path ref="formSampler" />
		</svg>

		<div class="atmo-grain" />
		<div class="atmo-vignette" />
	</div>
</template>

<style lang="postcss" scoped>
.lab-atmosphere {
  --lab-px: 0px;
  --lab-py: 0px;

  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  color: var(--accent, var(--color-text));
  -webkit-mask-image: linear-gradient(
    to bottom,
    #000 0,
    #000 66vh,
    transparent 98vh
  );
  mask-image: linear-gradient(to bottom, #000 0, #000 66vh, transparent 98vh);

  &__parallax {
    position: absolute;
    inset: 0;
    transform: translate3d(
      calc(var(--lab-px) + var(--lab-shift-x)),
      calc(var(--lab-py) + var(--lab-shift-y)),
      0
    );
    transition: transform 1100ms cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
  }

  &.is-contained {
    position: absolute;
    overflow: visible;
    -webkit-mask-image: none;
    mask-image: none;
  }

  &.is-contained .atmo-vignette {
    display: none;
  }
}

/* ---------------------------------------------------------------- 01 horizon */

.lab-atmosphere--horizon {
  .horizon-field {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--accent, var(--color-text)) 16%, transparent) 0%,
      color-mix(in srgb, var(--accent, var(--color-text)) 7%, transparent) 42%,
      transparent 78%
    );
  }

  .horizon-disc {
    position: absolute;
    top: -28vh;
    left: 50%;
    width: min(76vw, 78rem);
    aspect-ratio: 1;
    border: 1px solid color-mix(in srgb, var(--accent, var(--color-text)) 38%, transparent);
    border-radius: 50%;
    background: color-mix(in srgb, var(--accent, var(--color-text)) 22%, transparent);
    transform: translateX(-50%);
    animation: horizon-breathe 38s ease-in-out infinite alternate;
  }

  .horizon-disc__ring {
    position: absolute;
    inset: 9%;
    border: 1px solid
      color-mix(in srgb, var(--accent, var(--color-text)) 24%, transparent);
    border-radius: 50%;
  }

  .horizon-line {
    position: absolute;
    right: 0;
    left: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--accent, var(--color-text)) 48%, transparent) 18%,
      color-mix(in srgb, var(--accent, var(--color-text)) 48%, transparent) 82%,
      transparent 100%
    );
    opacity: 0.62;

    &--a {
      top: 43vh;
      animation: horizon-line 26s ease-in-out infinite alternate;
    }

    &--b {
      top: 46.5vh;
      opacity: 0.32;
      animation: horizon-line 26s 0.6s ease-in-out infinite alternate-reverse;
    }
  }

  &[data-page="pool"] {
    .horizon-field {
      background: linear-gradient(
        to right,
        color-mix(in srgb, var(--accent, var(--color-text)) 17%, transparent) 0%,
        color-mix(in srgb, var(--accent, var(--color-text)) 6%, transparent) 48%,
        transparent 86%
      );
    }

    .horizon-disc {
      top: -12vh;
      left: 5vw;
      width: min(44vw, 34rem);
      height: 106vh;
      aspect-ratio: auto;
      transform: none;
      animation-name: horizon-breathe-alt;
    }

    .horizon-disc__ring {
      inset: 7% 14%;
    }

    .horizon-line {
      top: 0;
      right: auto;
      left: 30vw;
      width: 1px;
      height: 100%;
      background: linear-gradient(
        180deg,
        transparent 0%,
        color-mix(in srgb, var(--accent, var(--color-text)) 44%, transparent) 18%,
        color-mix(in srgb, var(--accent, var(--color-text)) 44%, transparent) 82%,
        transparent 100%
      );

      &--a {
        left: 30vw;
        animation: horizon-line-y 30s ease-in-out infinite alternate;
      }

      &--b {
        top: 0;
        left: 33vw;
        animation: horizon-line-y 30s 0.6s ease-in-out infinite
          alternate-reverse;
      }
    }
  }

  &[data-page="words"] {
    .horizon-field {
      background: linear-gradient(
        to bottom,
        transparent 8%,
        color-mix(in srgb, var(--accent, var(--color-text)) 14%, transparent) 30%,
        color-mix(in srgb, var(--accent, var(--color-text)) 7%, transparent) 58%,
        transparent 88%
      );
    }

    .horizon-disc {
      top: 18vh;
      left: 4vw;
      width: min(92vw, 88rem);
      height: 58vh;
      aspect-ratio: auto;
      transform: none;
      animation-name: horizon-breathe-alt;
    }

    .horizon-disc__ring {
      inset: 14% 7%;
    }

    .horizon-line--a {
      top: 45vh;
    }

    .horizon-line--b {
      top: 48.5vh;
    }
  }
}

/* ----------------------------------------------------------------- 02 strata */

.lab-atmosphere--strata {
  .strata-plane {
    position: absolute;
    border: 1px solid color-mix(in srgb, var(--accent, var(--color-text)) 16%, transparent);
    border-radius: var(--radius-media);
    background: color-mix(in srgb, var(--accent, var(--color-text)) 6%, transparent);
    transform-origin: center center;
    will-change: transform;
  }

  .strata-plane--a {
    top: -4vh;
    left: -4vw;
    width: 108vw;
    height: 82vh;
    animation: strata-a 42s ease-in-out infinite alternate;
  }

  .strata-plane--b {
    top: 8vh;
    left: 8vw;
    width: 90vw;
    height: 68vh;
    border-color: color-mix(in srgb, var(--accent, var(--color-text)) 20%, transparent);
    background: color-mix(in srgb, var(--accent, var(--color-text)) 9%, transparent);
    animation: strata-b 46s 1s ease-in-out infinite alternate;
  }

  .strata-plane--c {
    top: 20vh;
    left: 22vw;
    width: 72vw;
    height: 54vh;
    border-color: color-mix(in srgb, var(--accent, var(--color-text)) 24%, transparent);
    background: color-mix(in srgb, var(--accent, var(--color-text)) 12%, transparent);
    animation: strata-c 50s 2s ease-in-out infinite alternate;
  }

  .strata-seam {
    position: absolute;
    top: 58%;
    right: 0;
    left: 0;
    height: 1px;
    background: color-mix(in srgb, var(--accent, var(--color-text)) 34%, transparent);
    opacity: 0.55;
  }

  &[data-page="pool"] {
    .strata-plane--a {
      top: -4vh;
      left: -4vw;
      width: 70vw;
      height: 84vh;
    }

    .strata-plane--b {
      top: 8vh;
      left: 8vw;
      width: 54vw;
      height: 68vh;
    }

    .strata-plane--c {
      top: 20vh;
      left: 22vw;
      width: 38vw;
      height: 52vh;
    }

    .strata-seam {
      top: 50%;
    }
  }

  &[data-page="words"] {
    .strata-plane--a {
      top: 6vh;
      left: -4vw;
      width: 104vw;
      height: 48vh;
    }

    .strata-plane--b {
      top: 16vh;
      left: 6vw;
      width: 86vw;
      height: 38vh;
    }

    .strata-plane--c {
      top: 26vh;
      left: 18vw;
      width: 68vw;
      height: 28vh;
    }

    .strata-seam {
      top: 54%;
    }
  }
}

/* ------------------------------------------------------------------- 03 form */

.lab-atmosphere--form {
  .form-shape {
    position: absolute;
    top: 50%;
    left: 50%;
    width: min(86vh, 86vw);
    height: min(86vh, 86vw);
    overflow: visible;
    color: var(--accent, var(--color-text));
    opacity: 1;
    transform: translate(-50%, -50%) translate(14vw, 1vh);
  }

  .form-line {
    stroke-opacity: 0.58;
  }

  .form-worm {
    /* Same ratio as the start page: the worm is a real path segment,
       redrawn every frame so the closed contour has no dash seam. */
    opacity: 1;
  }

  /* The foreground copy (HeroWorm) draws the same segment above the
     inactive cards, so the background copy is not painted twice. */
  &.is-foreground-worm .form-worm {
    display: none;
  }

  .form-sampler {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }

  &[data-page="shows"] .form-shape {
    transform: translate(-50%, -50%) translate(14vw, 2vh);
  }

  &[data-page="pool"] .form-shape {
    transform: translate(-50%, -50%) translate(16vw, 1vh);
  }

  &[data-page="words"] .form-shape {
    /* Words puts a tall caption under a 40svh image. A smaller contour,
       centred on the image band, keeps the worm on the artwork instead of
       running through the caption. */
    width: min(50vh, 86vw);
    height: min(50vh, 86vw);
    transform: translate(-50%, -50%) translate(12vw, -13vh);
  }
}

/* ------------------------------------------------------------------ common */

.atmo-grain {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  opacity: 0.04;
  mix-blend-mode: overlay;
}

.atmo-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse at 50% 32%,
    transparent 30%,
    color-mix(in srgb, var(--color-bg) 90%, transparent) 96%
  );
  opacity: 0.55;
}

/* -------------------------------------------------------------------- dark */

.lab-atmosphere.is-dark {
  .horizon-field {
    opacity: 0.9;
  }

  .horizon-disc {
    background: color-mix(in srgb, var(--accent, var(--color-text)) 30%, transparent);
    border-color: color-mix(in srgb, var(--accent, var(--color-text)) 48%, transparent);
  }

  .horizon-disc__ring {
    border-color: color-mix(in srgb, var(--accent, var(--color-text)) 32%, transparent);
  }

  .strata-plane {
    border-color: color-mix(in srgb, var(--accent, var(--color-text)) 28%, transparent);
    background: color-mix(in srgb, var(--accent, var(--color-text)) 10%, transparent);
  }

  .strata-plane--b {
    border-color: color-mix(in srgb, var(--accent, var(--color-text)) 34%, transparent);
    background: color-mix(in srgb, var(--accent, var(--color-text)) 14%, transparent);
  }

  .strata-plane--c {
    border-color: color-mix(in srgb, var(--accent, var(--color-text)) 40%, transparent);
    background: color-mix(in srgb, var(--accent, var(--color-text)) 18%, transparent);
  }

  .form-line {
    stroke-opacity: 0.72;
  }

  .atmo-vignette {
    opacity: 0.72;
  }
}

/* --------------------------------------------------------------- animations */

@keyframes horizon-breathe {
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
  }
  100% {
    transform: translateX(-50%) translateY(1.2vh) scale(1.025);
  }
}

@keyframes horizon-breathe-alt {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  100% {
    transform: translate3d(0, 1.2vh, 0) scale(1.018);
  }
}

@keyframes horizon-line {
  0% {
    transform: translateY(0);
    opacity: 0.4;
  }
  100% {
    transform: translateY(0.7vh);
    opacity: 0.62;
  }
}

@keyframes horizon-line-y {
  0% {
    transform: translateX(0);
    opacity: 0.4;
  }
  100% {
    transform: translateX(1vw);
    opacity: 0.6;
  }
}

@keyframes strata-a {
  0% {
    transform: rotate(-6deg) translate3d(0, 0, 0);
  }
  100% {
    transform: rotate(-5.2deg) translate3d(2vw, 1vh, 0);
  }
}

@keyframes strata-b {
  0% {
    transform: rotate(4deg) translate3d(0, 0, 0);
  }
  100% {
    transform: rotate(4.8deg) translate3d(-1.4vw, 1.4vh, 0);
  }
}

@keyframes strata-c {
  0% {
    transform: rotate(-2deg) translate3d(0, 0, 0);
  }
  100% {
    transform: rotate(-1.2deg) translate3d(1vw, -1vh, 0);
  }
}

/* ------------------------------------------------------------------ mobile */

@media screen and (max-width: 900px) {
  .lab-atmosphere {
    -webkit-mask-image: linear-gradient(
      to bottom,
      #000 0,
      #000 58vh,
      transparent 92vh
    );
    mask-image: linear-gradient(to bottom, #000 0, #000 58vh, transparent 92vh);

    &__parallax {
      transition: none;
    }
  }

  .lab-atmosphere--horizon {
    .horizon-disc {
      top: -18vh;
      width: 110vw;
    }

    &[data-page="pool"] .horizon-disc {
      top: -12vh;
      left: -8vw;
      width: 62vw;
      height: 86vh;
    }

    &[data-page="words"] .horizon-disc {
      top: 20vh;
      left: -8vw;
      width: 116vw;
      height: 44vh;
    }
  }

  .lab-atmosphere--strata {
    .strata-plane--a {
      top: 8vh;
      left: -8vw;
      width: 116vw;
      height: 54vh;
    }

    .strata-plane--b {
      top: 18vh;
      left: 2vw;
      width: 92vw;
      height: 44vh;
    }

    .strata-plane--c {
      top: 28vh;
      left: 12vw;
      width: 70vw;
      height: 34vh;
    }

    &[data-page="pool"] {
      .strata-plane--a {
        top: 2vh;
        left: -4vw;
        width: 76vw;
        height: 72vh;
      }

      .strata-plane--b {
        top: 12vh;
        left: 10vw;
        width: 58vw;
        height: 58vh;
      }

      .strata-plane--c {
        top: 22vh;
        left: 24vw;
        width: 42vw;
        height: 44vh;
      }
    }

    &[data-page="words"] {
      .strata-plane--a {
        top: 12vh;
        left: -10vw;
        width: 120vw;
        height: 38vh;
      }

      .strata-plane--b {
        top: 22vh;
        left: 0;
        width: 100vw;
        height: 30vh;
      }

      .strata-plane--c {
        top: 32vh;
        left: 12vw;
        width: 76vw;
        height: 22vh;
      }
    }
  }

  .lab-atmosphere--form {
    .form-shape {
      width: min(78vh, 92vw);
      height: min(78vh, 92vw);
      transform: translate(-50%, -50%) translate(0, -2vh);
    }

    .form-line {
      stroke-opacity: 0.5;
    }

    &[data-page="shows"] .form-shape,
    &[data-page="pool"] .form-shape,
    &[data-page="words"] .form-shape {
      transform: translate(-50%, -50%) translate(0, -2vh);
    }
  }

  .atmo-grain {
    opacity: 0.03;
  }
}

@media (prefers-reduced-motion: reduce) {
  .lab-atmosphere__parallax,
  .horizon-disc,
  .horizon-line,
  .strata-plane {
    animation: none;
    transition: none;
  }
}
</style>
