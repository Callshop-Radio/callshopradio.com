// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import imageUrlBuilder from "@sanity/image-url";

export default defineNuxtPlugin(() => {
	const builder = imageUrlBuilder(useSanity().config);
	function urlFor(source: string) {
		return builder.image(source).auto("format");
	}
	return {
		provide: { urlFor },
	};
});
