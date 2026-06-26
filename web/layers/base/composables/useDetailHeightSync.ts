import { computed, onMounted, ref } from "vue";

/**
 * Right-column height sync for the pool/set detail pages.
 *
 * Measures the left "main" column (`mainRef`) and exposes its height so the
 * media column can match it: a pixel number on desktop, or the string "100%"
 * below 900px (where the layout stacks). Watches for size and DOM changes via
 * Resize/Mutation observers plus a window-resize listener.
 *
 * Returns the raw `computedHeight` value only — each page keeps its own
 * `:style` expression, so its exact markup/behaviour is preserved.
 */
export const useDetailHeightSync = () => {
	const mainRef = ref<HTMLElement | null>(null);
	const mainHeight = ref(0);
	const windowWidth = ref(0);

	const computedHeight = computed<string | number>(() => {
		if (windowWidth.value <= 900) return "100%";
		return mainHeight.value;
	});

	const updateMainHeight = () => {
		if (mainRef.value) mainHeight.value = mainRef.value.offsetHeight;
	};

	const updateWindowWidth = () => {
		if (typeof window !== "undefined") windowWidth.value = window.innerWidth;
	};

	onMounted(() => {
		updateMainHeight();
		updateWindowWidth();

		if (typeof window !== "undefined" && mainRef.value) {
			const resizeObserver = new ResizeObserver(() => updateMainHeight());
			resizeObserver.observe(mainRef.value);

			window.addEventListener("resize", () => {
				updateWindowWidth();
				updateMainHeight();
			});

			const mutationObserver = new MutationObserver(() => updateMainHeight());
			mutationObserver.observe(mainRef.value, {
				childList: true,
				subtree: true,
				attributes: true,
				attributeFilter: ["style", "class"],
			});
		}
	});

	return { mainRef, mainHeight, windowWidth, computedHeight };
};
