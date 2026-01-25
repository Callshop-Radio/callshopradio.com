export default defineNuxtPlugin(() => {
  const router = useRouter();

  router.beforeEach((to, from, next) => {
    next();
  });
});
