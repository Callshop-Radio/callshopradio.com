export default defineNuxtPlugin(() => {
	const route = useRoute();

	const applyBodyClass = (bodyClass?: string) => {
		useHead({
			bodyAttrs: {
				class: bodyClass || "",
			},
		});
	};

	watch(
		() => route.meta.bodyClass,
		(bodyClass) => {
			applyBodyClass(typeof bodyClass === "string" ? bodyClass : "");
		},
		{ immediate: true },
	);
});
