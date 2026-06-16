export default defineNuxtPlugin(() => {
	const router = useRouter();

	router.beforeEach((_to, _from, next) => {
		next();
	});
});
