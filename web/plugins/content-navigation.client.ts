export default defineNuxtPlugin(() => {
	const router = useRouter();

	router.afterEach((to, from) => {
		if (to.path !== from.path) {
			window.scrollTo({ top: 0, left: 0, behavior: "instant" });
		}
	});
});
