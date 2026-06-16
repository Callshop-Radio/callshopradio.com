import { computed, type Ref } from "vue";
import { COVER_FLOW_ITEM_COUNT } from "./coverFlowUtils";
import type { CoverFlowContentType } from "./useCoverFlowSliderItems.types";

type SliderWithAutoLoad = {
	autoLoad?: boolean;
};

export function useCoverFlowSliderItems<T extends { _id?: string }>(
	slider: Ref<
		(SliderWithAutoLoad & Record<string, unknown>) | null | undefined
	>,
	itemsKey: string,
	options: {
		contentType: CoverFlowContentType;
		filter?: (item: T) => boolean;
	},
) {
	const isAutoLoad = computed(() => slider.value?.autoLoad !== false);

	const manualCandidates = computed(() => {
		const items = (slider.value?.[itemsKey] as T[] | undefined) ?? [];
		return options.filter ? items.filter(options.filter) : items;
	});

	// SSR-side fetch so the cover-flow items ship in the first paint —
	// otherwise the container appears empty on initial render and pops in
	// after hydration, causing a visible layout shift.
	const { data: randomItems, pending: isLoading } = useAsyncData<T[]>(
		`cover-flow-${options.contentType}`,
		() => {
			if (!isAutoLoad.value) return Promise.resolve([] as T[]);
			return $fetch<T[]>(`/api/cover-flow/${options.contentType}`);
		},
		{
			default: () => [] as T[],
			server: true,
			lazy: false,
		},
	);

	const featured = computed<T[]>(() => {
		if (!isAutoLoad.value) {
			return manualCandidates.value.slice(0, COVER_FLOW_ITEM_COUNT);
		}
		const items = randomItems.value ?? [];
		return options.filter ? items.filter(options.filter) : items;
	});

	return { featured, isAutoLoad, isLoading };
}
