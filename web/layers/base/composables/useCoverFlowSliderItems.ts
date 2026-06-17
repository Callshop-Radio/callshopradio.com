import { computed, type Ref } from "vue";
import { COVER_FLOW_ITEM_COUNT } from "./coverFlowUtils";
import type { CoverFlowContentType } from "./useCoverFlowSliderItems.types";

type SliderWithAutoLoad = {
	autoLoad?: boolean;
};

export async function useCoverFlowSliderItems<T extends { _id?: string }>(
	slider: Ref<
		(SliderWithAutoLoad & Record<string, unknown>) | null | undefined
	>,
	itemsKey: string,
	options: {
		contentType: CoverFlowContentType;
		filter?: (item: T) => boolean;
	},
) {
	const nuxtApp = useNuxtApp();
	const isAutoLoad = computed(() => slider.value?.autoLoad !== false);

	const manualCandidates = computed(() => {
		const items = (slider.value?.[itemsKey] as T[] | undefined) ?? [];
		return options.filter ? items.filter(options.filter) : items;
	});

	// Awaited so the random cover-flow items join the page's blocking Suspense
	// chain — the slider then ships in the first paint (SSR and client-side
	// navigation alike) instead of popping in afterwards and shifting layout.
	// getCachedData reuses the payload on revisits, keeping the random pick
	// stable (no re-shuffle flicker) and avoiding a refetch.
	const key = `cover-flow-${options.contentType}`;
	const { data: randomItems } = await useAsyncData<T[]>(
		key,
		() => {
			if (!isAutoLoad.value) return Promise.resolve([] as T[]);
			return $fetch<T[]>(`/api/cover-flow/${options.contentType}`);
		},
		{
			default: () => [] as T[],
			getCachedData: (cacheKey) =>
				(nuxtApp.payload.data[cacheKey] ?? nuxtApp.static.data[cacheKey]) as
					| T[]
					| undefined,
		},
	);

	const featured = computed<T[]>(() => {
		if (!isAutoLoad.value) {
			return manualCandidates.value.slice(0, COVER_FLOW_ITEM_COUNT);
		}
		const items = randomItems.value ?? [];
		return options.filter ? items.filter(options.filter) : items;
	});

	return { featured, isAutoLoad };
}
