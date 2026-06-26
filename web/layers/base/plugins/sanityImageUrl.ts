// @ts-nocheck
import { createImageUrlBuilder } from "@sanity/image-url";

export default defineNuxtPlugin(() => {
	const builder = createImageUrlBuilder(useSanity().config);
	function urlFor(source: string) {
		return builder.image(source).auto("format");
	}
	return {
		provide: { urlFor },
	};
});
