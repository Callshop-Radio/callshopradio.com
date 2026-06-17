import { useMediaQuery, useSwipe } from "@vueuse/core";
import { computed, nextTick, onMounted, type Ref, ref } from "vue";
import { COVER_FLOW_ANIMATION_MS } from "./coverFlowUtils";

const COVER_FLOW_SHIFT_1 = 11.5;
const COVER_FLOW_SHIFT_2 = 21;
const COVER_FLOW_SHIFT_HIDDEN = 26;

const COVER_FLOW_SHIFT_1_COMPACT = 8.75;
const COVER_FLOW_SHIFT_2_COMPACT = 15.5;
const COVER_FLOW_SHIFT_HIDDEN_COMPACT = 19;

type CoverFlowItem = { _id?: string };

export function useIntroCoverFlow(
	items: Ref<CoverFlowItem[]>,
	stageRef: Ref<HTMLElement | null>,
) {
	const currentIndex = ref(0);
	const isAnimating = ref(false);
	const visualOffsets = ref<Record<string, number>>({});

	// `useMediaQuery` resolves to false during SSR (no window) but reads the real
	// viewport synchronously on the client — so on a narrow screen the first client
	// render would diverge from the server HTML (different card shift = hydration
	// mismatch on .cover-flow__card-wrap). Gate it behind `mounted` so the first
	// client paint matches SSR (desktop shifts), then adopt the real query after
	// hydration completes.
	const mounted = ref(false);
	const compactQuery = useMediaQuery("(max-width: 900px)");
	const isCompactLayout = computed(() => mounted.value && compactQuery.value);

	const shiftStops = computed(() => {
		if (isCompactLayout.value) {
			return {
				shift1: COVER_FLOW_SHIFT_1_COMPACT,
				shift2: COVER_FLOW_SHIFT_2_COMPACT,
				shiftHidden: COVER_FLOW_SHIFT_HIDDEN_COMPACT,
			};
		}

		return {
			shift1: COVER_FLOW_SHIFT_1,
			shift2: COVER_FLOW_SHIFT_2,
			shiftHidden: COVER_FLOW_SHIFT_HIDDEN,
		};
	});

	const total = computed(() => items.value.length);

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

	function initVisualOffsets(center: number) {
		const next: Record<string, number> = {};
		items.value.forEach((item, index) => {
			if (!item._id) return;
			next[item._id] = normalizedOffset(index, center);
		});
		visualOffsets.value = next;
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

	function reconcileHiddenOffsets(center: number) {
		const next = { ...visualOffsets.value };

		items.value.forEach((item, index) => {
			if (!item._id) return;
			const target = normalizedOffset(index, center);
			const current = next[item._id] ?? target;

			if (Math.abs(current) > 2.5 && Math.abs(target) > 2) {
				next[item._id] = target;
			}
		});

		visualOffsets.value = next;
	}

	function getVisualOffset(index: number) {
		const id = items.value[index]?._id;
		if (!id) return 0;
		return (
			visualOffsets.value[id] ?? normalizedOffset(index, currentIndex.value)
		);
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
		const { shift1, shift2, shiftHidden } = shiftStops.value;
		return interpolate(abs, [
			[0, 0],
			[1, shift1],
			[2, shift2],
			[3, shiftHidden],
		]);
	}

	function getScale(abs: number) {
		return interpolate(abs, [
			[0, 1],
			[1, 0.86],
			[2, 0.74],
			[3, 0.68],
		]);
	}

	function getBlur(abs: number) {
		return interpolate(abs, [
			[0, 0],
			[1, 1.5],
			[2, 3],
			[3, 4],
		]);
	}

	function getOpacity(abs: number) {
		if (abs <= 0) return 1;
		if (abs <= 1) return 0.94;
		if (abs <= 2) return 0.82;
		if (abs <= 3) return 0;
		return 0;
	}

	function cardStyle(index: number) {
		const offset = getVisualOffset(index);
		const abs = Math.abs(offset);
		const xRem = getShiftMagnitude(abs) * Math.sign(offset);
		const scale = getScale(abs);

		return {
			transform: `translate3d(calc(-50% + ${xRem}rem), -50%, 0) scale(${scale})`,
			filter: `blur(${getBlur(abs)}px)`,
			opacity: getOpacity(abs),
			zIndex: Math.max(1, 5 - Math.min(4, Math.round(abs))),
			pointerEvents: Math.round(abs) === 0 ? "auto" : "none",
		};
	}

	function applyTargetOffsets(center: number) {
		visualOffsets.value = buildTargetOffsets(center);
	}

	function navigate(nextIndex: number) {
		if (total.value <= 1 || isAnimating.value) return;

		const normalized = mod(nextIndex, total.value);
		if (normalized === currentIndex.value) return;

		reconcileHiddenOffsets(currentIndex.value);
		isAnimating.value = true;
		currentIndex.value = normalized;

		nextTick(() => {
			requestAnimationFrame(() => {
				applyTargetOffsets(normalized);
			});
		});

		setTimeout(() => {
			isAnimating.value = false;
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

	useSwipe(() => stageRef.value, {
		threshold: 60,
		onSwipeEnd(_e, direction) {
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
		scrollNext,
		scrollPrev,
		scrollTo,
	};
}
