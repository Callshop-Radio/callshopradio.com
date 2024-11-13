export default defineNuxtConfig({
	css: ['~~/layers/base/assets/styles/main.postcss'],
	components: [
		{
			path: './components',
			pathPrefix: false
		}
	]
})
