// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export const useUtils = () => {
	//
	// Uses the favicon provided by the backend / store
	const favicon = () => {
		const mainStore = useMainStore();
		const favicon = mainStore?.siteSettings?.favicon;
		if (!favicon?.asset) {
			return;
		}
		const { $urlFor } = useNuxtApp();

		useHead({
			link: [
				{
					rel: "icon",
					href: favicon
						? $urlFor(favicon)
								.width(32)
								.height(32)
								.format("png")
								.fit("max")
								.url()
						: undefined,
					sizes: "32x32",
				},
				{
					rel: "icon",
					href: favicon ? $urlFor(favicon).url() : undefined,
					type: favicon ? favicon?.asset?.mimeType : undefined,
				},
				{
					rel: "apple-touch-icon",
					href: favicon
						? $urlFor(favicon)
								.width(1024)
								.height(1024)
								.format("png")
								.fit("max")
								.url()
						: undefined,
				},
			],
		});
	};

	return {
		favicon,
	};
};
