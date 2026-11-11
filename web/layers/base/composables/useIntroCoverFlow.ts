import { useMediaQuery, useSwipe } from "@vueuse/core";
import {
	type CSSProperties,
	computed,
	nextTick,
	onMounted,
	onUnmounted,
	type Ref,
	ref,
} from "vue";
import { COVER_FLOW_ANIMATION_MS } from "./coverFlowUtils";

const COVER_FLOW_SHIFT_1 = 11.5;
const COVER_FLOW_SHIFT_2 = 21;
const COVER_FLOW_SHIFT_3 = 26;
const COVER_FLOW_SHIFT_HIDDEN = 26;

const COVER_FLOW_SHIFT_1_WIDE = 14.75;
const COVER_FLOW_SHIFT_2_WIDE = 27;
const COVER_FLOW_SHIFT_3_WIDE = 34;
const COVER_FLOW_SHIFT_HIDDEN_WIDE = 38;

const COVER_FLOW_SHIFT_1_COMPACT = 8.75;
const COVER_FLOW_SHIFT_2_COMPACT = 15.5;
const COVER_FLOW_SHIFT_3_COMPACT = 19;
const COVER_FLOW_SHIFT_HIDDEN_COMPACT = 19;

type CoverFlowItem = { _id?: string };

type CoverFlowOrientation = "horizontal" | "vertical";

const VERTICAL_STOPS = {
	default: { shift1: 0.6, shift2: 1.6, shift3: 2.8, shiftHidden: 4 },
	wide: { shift1: 0.7, shift2: 1.8, shift3: 3.1, shiftHidden: 4.4 },
	compact: { shift1: 0.4, shift2: 1, shift3: 1.7, shiftHidden: 2.6 },
};

export function useIntroCoverFlow(
	items: Ref<CoverFlowItem[]>,
	stageRef: Ref<HTMLElement | null>,
	options: { orientation?: CoverFlowOrientation } = {},
) {
	const orientation = options.orientation ?? "horizontal";
	const currentIndex = ref(0);
	const isAnimating = ref(false);
	const visualOffsets = ref<Record<string, number>>({});
	// Stacking layers are kept separate from the target offsets: a card that
	// moves outwards keeps its old z-index while it fades/blurs, and a card
	// that moves inwards comes forward one layer early. The layers settle after
	// the transition instead of snapping at its start.
	const zIndices = ref<Record<string, number>>({});
	const snappingIds = ref<Set<string>>(new Set());
	// Rapid clicks must not be dropped. Every click advances currentIndex
	// immediately; only the newest request is allowed to apply its target
	// offsets, so the cards animate straight to the latest slide.
	let navigationToken = 0;
	let animationTimer: ReturnType<typeof setTimeout> | null = null;
	let zSettleTimer: ReturnType<typeof setTimeout> | null = null;

	// `useMediaQuery` resolves to false during SSR (no window) but reads the real
	// viewport synchronously on the client — so on a narrow screen the first client
	// render would diverge from the server HTML (different card shift = hydration
	// mismatch on .cover-flow__card-wrap). Gate it behind `mounted` so the first
	// client paint matches SSR (desktop shifts), then adopt the real query after
	// hydration completes.
	const mounted = ref(false);
	const compactQuery = useMediaQuery("(max-width: 900px)");
	const wideQuery = useMediaQuery("(min-width: 1340px)");
	const isCompactLayout = computed(() => mounted.value && compactQuery.value);
	const isWideLayout = computed(() => mounted.value && wideQuery.value);

	const shiftStops = computed(() => {
		if (isCompactLayout.value) {
			return {
				shift1: COVER_FLOW_SHIFT_1_COMPACT,
				shift2: COVER_FLOW_SHIFT_2_COMPACT,
				shift3: COVER_FLOW_SHIFT_3_COMPACT,
				shiftHidden: COVER_FLOW_SHIFT_HIDDEN_COMPACT,
			};
		}

		if (isWideLayout.value) {
			return {
				shift1: COVER_FLOW_SHIFT_1_WIDE,
				shift2: COVER_FLOW_SHIFT_2_WIDE,
				shift3: COVER_FLOW_SHIFT_3_WIDE,
				shiftHidden: COVER_FLOW_SHIFT_HIDDEN_WIDE,
			};
		}

		return {
			shift1: COVER_FLOW_SHIFT_1,
			shift2: COVER_FLOW_SHIFT_2,
			shift3: COVER_FLOW_SHIFT_3,
			shiftHidden: COVER_FLOW_SHIFT_HIDDEN,
		};
	});

	const total = computed(() => items.value.length);

	// The card-file stack only fades downward in small steps; horizontal
	// coverflow keeps its wide sideways offsets.
	const verticalStops = computed(() => {
		if (isCompactLayout.value) return VERTICAL_STOPS.compact;
		if (isWideLayout.value) return VERTICAL_STOPS.wide;
		return VERTICAL_STOPS.default;
	});

	function mod(index: number, count: number) {
		return ((index % count) + count) % count;
	}

	function normalizedOffset(index: number, center: number) {
		const count = total.value;
		if (count <= 1) return 0;

		let diff = index - center;
		if (diff > count / 2) diff -= count;
		if (diff < -count / 2) diff += count;
		return diff;
	}

	function shortestStep(prev: number, target: number, count: number) {
		let delta = target - prev;
		if (delta > count / 2) delta -= count;
		if (delta < -count / 2) delta += count;
		return prev + delta;
	}

	function zTier(abs: number) {
		return Math.max(1, 5 - Math.min(4, Math.round(abs)));
	}

	function initVisualOffsets(center: number) {
		const next: Record<string, number> = {};
		const z: Record<string, number> = {};
		items.value.forEach((item, index) => {
			if (!item._id) return;
			const offset = normalizedOffset(index, center);
			next[item._id] = offset;
			z[item._id] = zTier(Math.abs(offset));
		});
		visualOffsets.value = next;
		zIndices.value = z;
	}

	function buildTargetOffsets(center: number) {
		const count = total.value;
		const next: Record<string, number> = {};

		items.value.forEach((item, index) => {
			if (!item._id) return;
			const target = normalizedOffset(index, center);
			const prev = visualOffsets.value[item._id] ?? target;
			next[item._id] = count > 1 ? shortestStep(prev, target, count) : 0;
		});

		return next;
	}

	// Cards that are off-screen can be moved to their new relative position
	// without animating. This is what makes multi-step jumps (rapid clicks)
	// keep every card on the correct side of the ring instead of sweeping a
	// hidden card across the whole stage.
	function snapHiddenToCenter(center: number) {
		const next = { ...visualOffsets.value };
		const snapped = new Set<string>();

		items.value.forEach((item, index) => {
			if (!item._id) return;
			const current = next[item._id];
			if (current === undefined || Math.abs(current) <= 2.5) return;

			const target = normalizedOffset(index, center);
			const crossesRing =
				target !== 0 && Math.sign(target) !== Math.sign(current);

			// Snap cards that would cross the stage or become the new center.
			// A hidden card entering on the same side (e.g. +3 -> +2) may still
			// animate, which preserves the normal one-step fade-in.
			if (crossesRing || target === 0 || Math.abs(target) > 2.5) {
				next[item._id] = target;
				snapped.add(item._id);
			}
		});

		visualOffsets.value = next;
		return snapped;
	}

	function getVisualOffset(index: number) {
		const id = items.value[index]?._id;
		if (!id) return 0;
		return (
			visualOffsets.value[id] ?? normalizedOffset(index, currentIndex.value)
		);
	}

	function isSnapping(id: string | undefined) {
		return id ? snappingIds.value.has(id) : false;
	}

	function interpolate(value: number, stops: Array<[number, number]>) {
		const abs = Math.abs(value);

		if (abs <= stops[0][0]) return stops[0][1];

		for (let i = 1; i < stops.length; i++) {
			const [pos, amount] = stops[i];
			const [prevPos, prevAmount] = stops[i - 1];

			if (abs <= pos) {
				const progress = (abs - prevPos) / (pos - prevPos);
				return prevAmount + (amount - prevAmount) * progress;
			}
		}

		return stops[stops.length - 1][1];
	}

	function getShiftMagnitude(abs: number) {
		const { shift1, shift2, shift3, shiftHidden } =
			orientation === "vertical" ? verticalStops.value : shiftStops.value;
		return interpolate(abs, [
			[0, 0],
			[1, shift1],
			[2, shift2],
			[3, shift3],
			[4, shiftHidden],
		]);
	}

	function getScale(abs: number) {
		if (orientation === "vertical") {
			// The pulled-out card takes the full stage width; the pile sits
			// slightly inset and lower behind it.
			return interpolate(abs, [
				[0, 1],
				[1, 0.97],
				[2, 0.94],
				[3, 0.91],
			]);
		}

		const scale1 = isWideLayout.value ? 0.84 : 0.86;
		const scale2 = isWideLayout.value ? 0.7 : 0.74;
		const farScale = isWideLayout.value ? 0.54 : 0.68;
		return interpolate(abs, [
			[0, 1],
			[1, scale1],
			[2, scale2],
			[3, farScale],
		]);
	}

	function getBlur(abs: number) {
		const farBlur = isWideLayout.value ? 7 : 5;
		return interpolate(abs, [
			[0, 0],
			[1, 2.5],
			[2, 4.5],
			[3, farBlur],
		]);
	}

	function getOpacity(abs: number) {
		const stops: Array<[number, number]> = isWideLayout.value
			? [
					[0, 1],
					[1, 0.78],
					[2, 0.58],
					[3, 0.45],
					[4, 0],
				]
			: [
					[0, 1],
					[1, 0.78],
					[2, 0.58],
					[3, 0],
				];

		return interpolate(abs, stops);
	}

	function cardStyle(index: number): CSSProperties {
		const offset = getVisualOffset(index);
		const abs = Math.abs(offset);
		const shift = getShiftMagnitude(abs);
		const scale = getScale(abs);
		const id = items.value[index]?._id;
		const zIndex = id ? (zIndices.value[id] ?? zTier(abs)) : zTier(abs);

		if (orientation === "vertical") {
			// The active card sits at the top of the stage; every other card
			// stacks below it with a small baseline gap so the pile is visible.
			const baseline = abs < 0.5 ? 0 : 1.6;
			const yRem = shift + baseline;
			return {
				transform: `translate3d(-50%, ${yRem}rem, 0) scale(${scale})`,
				filter: `blur(${getBlur(abs)}px)`,
				opacity: getOpacity(abs),
				zIndex,
				pointerEvents: Math.round(abs) === 0 ? "auto" : "none",
			};
		}

		const xRem = shift * Math.sign(offset);

		return {
			transform: `translate3d(calc(-50% + ${xRem}rem), -50%, 0) scale(${scale})`,
			filter: `blur(${getBlur(abs)}px)`,
			opacity: getOpacity(abs),
			zIndex,
			pointerEvents: Math.round(abs) === 0 ? "auto" : "none",
		};
	}

	function settleZIndices(offsets: Record<string, number>) {
		const settled: Record<string, number> = {};
		items.value.forEach((item) => {
			if (!item._id) return;
			settled[item._id] = zTier(Math.abs(offsets[item._id] ?? 0));
		});
		zIndices.value = settled;
	}

	function applyTargetOffsets(center: number) {
		const previous = { ...visualOffsets.value };
		const next = buildTargetOffsets(center);
		const nextZ: Record<string, number> = { ...zIndices.value };
		let hasOutward = false;

		items.value.forEach((item) => {
			if (!item._id) return;
			const id = item._id;
			const old = previous[id] ?? 0;
			const target = next[id] ?? 0;
			const oldAbs = Math.abs(old);
			const targetAbs = Math.abs(target);
			const oldZ = nextZ[id] ?? zTier(oldAbs);
			const targetZ = zTier(targetAbs);

			if (targetAbs === 0) {
				// The incoming centre must be above the outgoing centre even
				// when a rapid jump snapped it straight into place.
				nextZ[id] = 6;
			} else if (targetAbs > oldAbs + 0.01) {
				// Moving outwards: stay in the old layer while fading/blurring,
				// then settle behind after the transition.
				nextZ[id] = oldZ;
				hasOutward = true;
			} else if (targetAbs < oldAbs - 0.01) {
				// Moving inwards: come forward while still blurred/faded so the
				// layer change is hidden by the opacity/filter transition.
				nextZ[id] = Math.min(6, targetZ + 1);
			} else {
				nextZ[id] = targetZ;
			}
		});

		visualOffsets.value = next;
		zIndices.value = nextZ;

		if (zSettleTimer) clearTimeout(zSettleTimer);
		const token = navigationToken;

		if (!hasOutward) {
			settleZIndices(next);
			return;
		}

		zSettleTimer = setTimeout(() => {
			if (token !== navigationToken) return;
			settleZIndices(next);
			zSettleTimer = null;
		}, COVER_FLOW_ANIMATION_MS);
	}

	function navigate(nextIndex: number) {
		if (total.value <= 1) return;

		const normalized = mod(nextIndex, total.value);
		if (normalized === currentIndex.value) return;

		const token = ++navigationToken;
		isAnimating.value = true;
		currentIndex.value = normalized;

		nextTick(() => {
			requestAnimationFrame(() => {
				// A newer click superseded this one; applying the old target
				// would make the cover flow jump backwards for one frame.
				if (token !== navigationToken) return;
				snappingIds.value = snapHiddenToCenter(normalized);
				applyTargetOffsets(normalized);
				// The snap class disables transitions for one frame. Clear it
				// after the browser has painted the new position, unless a
				// newer navigation already took over.
				requestAnimationFrame(() => {
					if (token === navigationToken) snappingIds.value = new Set();
				});
			});
		});

		if (animationTimer) clearTimeout(animationTimer);
		animationTimer = setTimeout(() => {
			if (token === navigationToken) isAnimating.value = false;
		}, COVER_FLOW_ANIMATION_MS);
	}

	const scrollNext = () => {
		navigate(currentIndex.value + 1);
	};

	const scrollPrev = () => {
		navigate(currentIndex.value - 1);
	};

	const scrollTo = (index: number) => {
		navigate(index);
	};

	onMounted(() => {
		mounted.value = true;
		initVisualOffsets(currentIndex.value);
	});

	onUnmounted(() => {
		if (animationTimer) clearTimeout(animationTimer);
		if (zSettleTimer) clearTimeout(zSettleTimer);
	});

	useSwipe(() => stageRef.value, {
		threshold: 60,
		onSwipeEnd(_e, direction) {
			if (orientation === "vertical") {
				if (direction === "up") scrollNext();
				if (direction === "down") scrollPrev();
				return;
			}
			if (direction === "left") scrollNext();
			if (direction === "right") scrollPrev();
		},
	});

	return {
		currentIndex,
		isAnimating,
		total,
		cardStyle,
		getVisualOffset,
		isSnapping,
		scrollNext,
		scrollPrev,
		scrollTo,
	};
}
