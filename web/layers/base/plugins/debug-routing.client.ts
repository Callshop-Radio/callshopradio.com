export default defineNuxtPlugin(() => {
  const router = useRouter();

  router.beforeEach((to, from, next) => {
    console.group('🚦 Routing Debug');
    console.log('From:', from.fullPath);
    console.log('To:', to.fullPath);
    console.log('Middleware:', to.meta.middleware);
    console.groupEnd();
    next();
  });

  router.afterEach((to, from) => {
    console.log('✅ Navigation Complete:', to.fullPath);
  });

  router.onError((error) => {
    console.error('❌ Router Error:', error);
  });
});
