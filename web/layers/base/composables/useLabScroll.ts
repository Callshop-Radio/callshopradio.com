import { computed, nextTick, onMounted, onUnmounted, type Ref, ref } from "vue";

type LabScrollItem = { _id?: string };

type LabScrollOptions = {
	align?: "center" | "start";
	initialIndex?: number;
	/** Repeated item sets make the slider endless; recenter by one set. */
	loop?: boolean;
	/** Number of unique items; the DOM contains three copies. */
	loopSize?: number;
};

/**
 * Native scroll-snap slider for the hero design lab.
 *
 * The browser owns the touch physics and snap behaviour; this composable only
 * adds mouse drag, keyboard control, active-index tracking and per-item
 * distance values for the depth/blur styling. It is intentionally throwaway
 * lab code, not the production interaction layer.
 */
export function useLabScroll(
	viewport: Ref<HTMLElement | null>,
	items: Ref<LabScrollItem[]>,
	options: LabScrollOptions = {},
) {
	const align = options.align ?? "center";
	const initialIndex = options.initialIndex ?? 0;
	const loop = options.loop ?? false;
	const loopSize = options.loopSize ?? 0;
	const activeIndex = ref(initialIndex);
	const distances = ref<number[]>([]);
	const progress = ref(0);
	const isDragging = ref(false);
	const reduceMotion = ref(false);
	const total = computed(() => items.value.length);

	let frame = 0;
	let settleTimer = 0;
	let loopJumpToken = 0;
	let dragStartX = 0;
	let dragStartScroll = 0;
	let dragged = false;
	let pressed = false;
	let resizeObserver: ResizeObserver | null = null;

	const clamp = (value: number, min: number, max: number) =>
		Math.min(max, Math.max(min, value));

	function measure() {
		const el = viewport.value;
		if (!el) return;

		const children = Array.from(el.querySelectorAll<HTMLElement>(".lab-item"));
		if (!children.length) return;

		// Use layout positions, not getBoundingClientRect(). The cards are
		// scaled by inline transforms, so measuring their visual rect creates a
		// feedback loop: scale changes the rect, the rect changes the distance,
		// the distance changes the scale again. offsetLeft/offsetWidth ignore
		// transforms and keep the focus pull stable through the whole travel.
		const scroll = el.scrollLeft;
		const track = el.querySelector<HTMLElement>(".lab-track");
		const startOffset =
			align === "start" && track
				? Number.parseFloat(getComputedStyle(track).paddingLeft) || 0
				: 0;
		const reference =
			align === "start" ? scroll + startOffset : scroll + el.clientWidth / 2;
		const nextDistances: number[] = [];
		let closest = 0;
		let closestDistance = Number.POSITIVE_INFINITY;

		children.forEach((child, index) => {
			const point =
				align === "start"
					? child.offsetLeft
					: child.offsetLeft + child.offsetWidth / 2;
			const distance = (point - reference) / Math.max(1, child.offsetWidth);
			nextDistances[index] = distance;

			if (Math.abs(distance) < closestDistance) {
				closestDistance = Math.abs(distance);
				closest = index;
			}
		});

		distances.value = nextDistances;
		if (closest !== activeIndex.value) activeIndex.value = closest;

		const maxScroll = el.scrollWidth - el.clientWidth;
		progress.value = maxScroll > 0 ? el.scrollLeft / maxScroll : 0;
	}

	function scheduleMeasure() {
		if (frame) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			measure();
		});
	}

	function handleScroll() {
		scheduleMeasure();
		if (!loop) return;
		if (settleTimer) clearTimeout(settleTimer);
		settleTimer = window.setTimeout(() => {
			settleTimer = 0;
			if (!isDragging.value) recenterLoop();
		}, 220);
	}

	function loopMetrics() {
		const el = viewport.value;
		if (!el || !loop || loopSize <= 1) return null;

		const children = Array.from(el.querySelectorAll<HTMLElement>(".lab-item"));
		if (children.length < loopSize * 2) return null;

		const first = children[0];
		const nextSet = children[loopSize];
		if (!first || !nextSet) return null;

		const setWidth = nextSet.offsetLeft - first.offsetLeft;
		if (setWidth <= 0) return null;

		return { el, setWidth };
	}

	function normalizeLoopIndex(index: number) {
		if (!loop || loopSize <= 1) return index;
		let normalized = index;
		while (normalized < loopSize) normalized += loopSize;
		while (normalized >= loopSize * 2) normalized -= loopSize;
		return normalized;
	}

	function shiftLoop(sets: number) {
		if (!loop || sets === 0) return true;
		const metrics = loopMetrics();
		if (!metrics) return false;

		// One full set is a pixel-identical copy, so the jump is invisible. The
		// copies must also skip their entrance transitions: the card that lands
		// on the start line was an off-screen exit card one frame earlier.
		const token = ++loopJumpToken;
		metrics.el.classList.add("is-loop-jump");
		void metrics.el.offsetWidth;

		metrics.el.scrollLeft += sets * metrics.setWidth;
		activeIndex.value += sets * loopSize;
		measure();

		nextTick(() => {
			if (token !== loopJumpToken) return;
			void metrics.el.offsetWidth;
			metrics.el.classList.remove("is-loop-jump");
		});
		return true;
	}

	function recenterLoop() {
		if (!loop || loopSize <= 1) return;
		const index = activeIndex.value;
		if (index >= loopSize && index < loopSize * 2) return;

		const normalized = normalizeLoopIndex(index);
		shiftLoop((normalized - index) / loopSize);
	}

	function scrollToIndex(index: number, smooth = true) {
		const el = viewport.value;
		if (!el) return;

		const children = Array.from(el.querySelectorAll<HTMLElement>(".lab-item"));
		if (!children.length) return;

		let targetIndex = index;
		let jumped = false;
		if (loop && loopSize > 1) {
			// Pick the copy of the target closest to the current card, then
			// make sure the smooth scroll itself stays inside the middle copy.
			const anchor = activeIndex.value;
			while (targetIndex - anchor > loopSize / 2) targetIndex -= loopSize;
			while (targetIndex - anchor < -loopSize / 2) targetIndex += loopSize;

			const shift =
				targetIndex < loopSize ? 1 : targetIndex >= loopSize * 2 ? -1 : 0;
			if (shift && shiftLoop(shift)) {
				targetIndex += shift * loopSize;
				jumped = true;
			}
		}

		const target = children[clamp(targetIndex, 0, children.length - 1)];
		if (!target) return;

		const track = el.querySelector<HTMLElement>(".lab-track");
		const startOffset =
			align === "start" && track
				? Number.parseFloat(getComputedStyle(track).paddingLeft) || 0
				: 0;
		const left =
			align === "center"
				? target.offsetLeft - (el.clientWidth - target.offsetWidth) / 2
				: target.offsetLeft - startOffset;

		const behavior = smooth && !reduceMotion.value ? "smooth" : "auto";
		const scroll = () =>
			el.scrollTo({
				left: clamp(left, 0, el.scrollWidth - el.clientWidth),
				behavior,
			});

		if (jumped) {
			// Let Vue apply the new active state with transitions disabled
			// before the smooth scroll starts.
			requestAnimationFrame(scroll);
		} else {
			scroll();
		}
	}

	function goTo(index: number) {
		scrollToIndex(index);
	}

	function next() {
		scrollToIndex(activeIndex.value + 1);
	}

	function prev() {
		scrollToIndex(activeIndex.value - 1);
	}

	function removeDragListeners() {
		window.removeEventListener("pointermove", onPointerMove);
		window.removeEventListener("pointerup", onPointerUp);
		window.removeEventListener("pointercancel", onPointerUp);
	}

	function onPointerDown(event: PointerEvent) {
		if (event.pointerType !== "mouse") return;
		const el = viewport.value;
		if (!el) return;

		// Do not style the scroll container or start a drag until the pointer
		// has actually moved. A plain click must stay a click: the card and its
		// buttons rely on the pointerup landing on the same element.
		pressed = true;
		dragged = false;
		isDragging.value = false;
		dragStartX = event.clientX;
		dragStartScroll = el.scrollLeft;
		window.addEventListener("pointermove", onPointerMove, { passive: true });
		window.addEventListener("pointerup", onPointerUp);
		window.addEventListener("pointercancel", onPointerUp);
	}

	function onPointerMove(event: PointerEvent) {
		if (!pressed) return;
		const el = viewport.value;
		if (!el) return;

		const delta = event.clientX - dragStartX;
		if (!dragged && Math.abs(delta) > 4) {
			dragged = true;
			isDragging.value = true;
			el.style.scrollSnapType = "none";
			el.style.scrollBehavior = "auto";
			el.style.cursor = "grabbing";
		}
		if (dragged) el.scrollLeft = dragStartScroll - delta;
	}

	function onPointerUp() {
		if (!pressed) return;
		const el = viewport.value;
		pressed = false;
		removeDragListeners();

		if (!el) return;
		isDragging.value = false;
		el.style.scrollSnapType = "x mandatory";
		el.style.scrollBehavior = "";
		el.style.cursor = "";
		if (dragged) scrollToIndex(activeIndex.value);
	}

	function onClickCapture(event: MouseEvent) {
		if (!dragged) return;
		event.preventDefault();
		event.stopPropagation();
		dragged = false;
	}

	onMounted(() => {
		reduceMotion.value = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		nextTick(() => {
			requestAnimationFrame(() => {
				const el = viewport.value;
				if (el) el.style.scrollSnapType = "none";
				scrollToIndex(initialIndex, false);
				measure();
				requestAnimationFrame(() => {
					if (!el) return;
					el.style.scrollSnapType = "x mandatory";
					measure();
				});
			});
		});

		const el = viewport.value;
		if (el) {
			resizeObserver = new ResizeObserver(scheduleMeasure);
			resizeObserver.observe(el);
			el.querySelectorAll(".lab-item").forEach((item) => {
				resizeObserver?.observe(item);
			});
		}
	});

	onUnmounted(() => {
		if (frame) cancelAnimationFrame(frame);
		if (settleTimer) clearTimeout(settleTimer);
		resizeObserver?.disconnect();
		removeDragListeners();
	});

	return {
		activeIndex,
		distances,
		progress,
		isDragging,
		reduceMotion,
		total,
		measure,
		onScroll: handleScroll,
		scrollToIndex,
		goTo,
		next,
		prev,
		onPointerDown,
		onPointerMove,
		onPointerUp,
		onClickCapture,
	};
}
