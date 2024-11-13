// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export const useUtils = () => {
	//
	// Creates a console log credit
	const creditLog = () => {
		const inlineCSS
      = 'padding: 15px; background-color: #f8f8f8; color: black; border-radius: 5px'
		onMounted(() => {
			console.log('%cOfficial Marco Land Beautiful Web Solution', inlineCSS)
		})
	}

	//
	// Uses the favicon provided by the backend / store
	const favicon = () => {
		const mainStore = useMainStore()
		const favicon = mainStore?.siteSettings?.favicon
		if (!favicon?.asset) {
			return
		}
		const { $urlFor } = useNuxtApp()

		useHead({
			link: [
				{
					rel: 'icon',
					href: favicon
						? $urlFor(favicon)
							.width(32)
							.height(32)
							.format('png')
							.fit('max')
							.url()
						: undefined,
					sizes: '32x32'
				},
				{
					rel: 'icon',
					href: favicon ? $urlFor(favicon).url() : undefined,
					type: favicon ? favicon?.asset?.mimeType : undefined
				},
				{
					rel: 'apple-touch-icon',
					href: favicon
						? $urlFor(favicon)
							.width(1024)
							.height(1024)
							.format('png')
							.fit('max')
							.url()
						: undefined
				}
			]
		})
	}

	return {
		creditLog,
		favicon
	}
}
