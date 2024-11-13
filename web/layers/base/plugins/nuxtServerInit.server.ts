// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useMainStore } from '~/stores/mainStore'

export default defineNuxtPlugin(async ({ $pinia }) => {
	const mainStore = useMainStore($pinia)
	await mainStore.nuxtServerInit()
})
