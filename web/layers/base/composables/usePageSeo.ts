// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
export default async function (seo) {
	if (!seo) {
		return
	}

	const TITLE_SEPARATOR = '|'
	const isHomepage = computed(() => useRoute()?.name === 'index')
	const title = computed(() =>
		isHomepage?.value
			? seo?.title
			: `${seo?.title} ${TITLE_SEPARATOR} ${seo?.pageTitle}`
	)

	useSeoMeta({
		title: title?.value,
		ogTitle: title?.value,
		description: seo?.metaDescription,
		ogDescription: seo?.metaDescription,
		ogImage: seo?.ogImage,
		twitterCard: 'summary_large_image'
	})
}
