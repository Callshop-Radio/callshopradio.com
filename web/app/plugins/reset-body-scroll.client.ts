export default defineNuxtPlugin(() => {
	const router = useRouter();

	router.afterEach(() => {
		document.body.style.overflow = "";
	});
});
