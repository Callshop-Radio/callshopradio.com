export default defineEventHandler(async (event) => {
	const config = useRuntimeConfig()
	const query = getQuery(event)
	
	const endpoint = query.endpoint as string
	const requiresAuth = query.auth === 'true'
	
	if (!endpoint) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Endpoint parameter is required'
		})
	}
	
	try {
		const headers: Record<string, string> = {
			'Content-Type': 'application/json'
		}
		
		// Add API key if authentication is required
		if (requiresAuth && config.public.libretimeApiKey) {
			headers['Authorization'] = `Api-Key ${config.public.libretimeApiKey}`
		}
		
		const response = await $fetch(endpoint, {
			headers,
			// Disable auto error throwing to handle errors manually
			ignoreResponseError: true
		})
		
		return response
	} catch (error) {
		console.error('[LibreTime Proxy] Error fetching:', error)
		throw createError({
			statusCode: 500,
			statusMessage: 'Failed to fetch data from LibreTime API'
		})
	}
})
