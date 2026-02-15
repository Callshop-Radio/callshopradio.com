<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'
import { useMainStore } from '~/stores/mainStore'

const mainStore = useMainStore()

// Define stream URLs
const streamUrl1 = 'https://icecast.callshopradio.com/callshopradio'
const streamUrl2 = 'https://icecast.callshopradio.com/callshopradio-wien'

// Store audio elements outside Vue's reactivity system
let audioEl1 = null
let audioEl2 = null

// Status refs
const isPlaying1 = ref(false)
const isPlaying2 = ref(false)
const isLoading1 = ref(false)
const isLoading2 = ref(false)

// Separately stored live status that doesn't update automatically
const liveStatus = ref({
	stream1: {
		onAirLight: {},
		liveData: {},
		icecastData: {}
	},
	stream2: {
		onAirLight: {},
		liveData: {}
	}
})

// Helper function for API calls via proxy
const fetcher = async (url, requiresAuth = false) => {
	try {
		// Use the Nitro API proxy to avoid CORS issues
		const proxyUrl = `/api/libretime-proxy?endpoint=${encodeURIComponent(url)}&auth=${requiresAuth}`
		const response = await $fetch(proxyUrl)
		return response
	} catch (error) {
		console.error(`[MusicController] Fetch error for ${url}:`, error)
		return null
	}
}

	// Manual status update function
const updateLiveStatus = async () => {
	try {
		// Stream 1
		const liveInfoUrl1 = 'https://libretime.callshopradio.com/api/live-info-v2'
		const onAirLightUrl1 = 'https://libretime.callshopradio.com/api/on-air-light/format/json'
		const icecastUrl = 'https://icecast.callshopradio.com/status-json.xsl'

		// Stream 2
		const liveInfoUrl2 = 'https://wien.callshopradio.com/api/live-info-v2?days=7'

		const [liveData1, onAirLight1, icecastData, liveData2] = await Promise.all([
			fetcher(liveInfoUrl1, true),  // requiresAuth = true
			fetcher(onAirLightUrl1, true), // requiresAuth = true
			fetcher(icecastUrl, false).catch(() => null), // no auth
			fetcher(liveInfoUrl2, false) // no auth
		])

		// Adapt format for Stream 2
		let onAirLight2 = null
		if (liveData2) {
			onAirLight2 = {
				on_air_light:
          liveData2.sources.livedj === 'on' ||
          liveData2.sources.masterdj === 'on',
				live_stream: liveData2.sources.livedj === 'on',
				live_stream_on_air: liveData2.sources.livedj === 'on',
				master_stream: liveData2.sources.masterdj === 'on',
				master_stream_on_air: liveData2.sources.masterdj === 'on'
			}
		}

		// Update status without disturbing audio elements
		liveStatus.value = {
			stream1: {
				onAirLight: onAirLight1 || {},
				liveData: liveData1 || {},
				icecastData: icecastData || {}
			},
			stream2: {
				onAirLight: onAirLight2 || {},
				liveData: liveData2 || {}
			}
		}

		// Debug: Log successful update
		console.log('[MusicController] Live status updated:', {
			hasLiveData1: !!liveData1,
			hasOnAirLight1: !!onAirLight1,
			hasLiveData2: !!liveData2
		})
	} catch (error) {
		console.error('[MusicController] Error updating live status:', error)
	}
}
// Function to play and stop stream for Track 1

// Function to play and stop stream for Track 1
const togglePlay1 = () => {
	if (!audioEl1) return

	if (isPlaying1.value) {
		audioEl1.pause()
		isPlaying1.value = false
		isLoading1.value = false
	} else {
		// If Track 2 is playing, pause it
		if (isPlaying2.value && audioEl2) {
			audioEl2.pause()
			isPlaying2.value = false
			isLoading2.value = false
		}

		isLoading1.value = true

		// Set active streaming channel to channelOne
		mainStore.setActiveStreamingChannel('channelOne')

		// Reload stream to ensure it starts from beginning
		audioEl1.src = streamUrl1
		audioEl1.load()

		// Reset SoundCloud player - use the new store method
		mainStore.resetSoundCloudPlayer()

		// Create new audio context with each play
		const playPromise = audioEl1.play()

		if (playPromise !== undefined) {
			playPromise
				.then(() => {
					isLoading1.value = false
					isPlaying1.value = true

					// Update MediaSession metadata
					if ('mediaSession' in navigator) {
						updateMediaSessionMetadata()
					}
				})
				.catch((_err) => {
					isLoading1.value = false
				})
		}
	}
}

// Function to play and stop stream for Track 2
const togglePlay2 = () => {
	if (!audioEl2) return

	if (isPlaying2.value) {
		audioEl2.pause()
		isPlaying2.value = false
		isLoading2.value = false
	} else {
		// If Track 1 is playing, pause it
		if (isPlaying1.value && audioEl1) {
			audioEl1.pause()
			isPlaying1.value = false
			isLoading1.value = false
		}

		isLoading2.value = true

		// Set active streaming channel to channelTwo
		mainStore.setActiveStreamingChannel('channelTwo')

		// Reload stream to ensure it starts from beginning
		audioEl2.src = streamUrl2
		audioEl2.load()

		// Reset SoundCloud player - use the new store method
		mainStore.resetSoundCloudPlayer()

		// Create new audio context with each play
		const playPromise = audioEl2.play()

		if (playPromise !== undefined) {
			playPromise
				.then(() => {
					isLoading2.value = false
					isPlaying2.value = true

					// Update MediaSession metadata
					if ('mediaSession' in navigator) {
						updateMediaSessionMetadata()
					}
				})
				.catch((_err) => {
					isLoading2.value = false
				})
		}
	}
}

// Parse strings with entities
const parseString = (string) => {
	if (!string) return ''
	return string
		.replace(/&amp;/g, '&')
		.replace(/&gt;/g, '>')
		.replace(/&lt;/g, '<')
		.replace(/&quot;/g, '"')
}

// Helper functions to check if current show is live
const isCurrentShowLive1 = computed(() => {
	const { liveData } = liveStatus.value.stream1
	if (liveData?.shows?.current) {
		const description = liveData.shows.current.description || ''
		return description.toLowerCase().includes('live')
	}
	return false
})

const isCurrentShowLive2 = computed(() => {
	const { liveData } = liveStatus.value.stream2
	if (liveData?.shows?.current) {
		const description = liveData.shows.current.description || ''
		return description.toLowerCase().includes('live')
	}
	return false
})

// Helper functions to determine the correct live status
const getActualLiveStatus1 = computed(() => {
	const { onAirLight } = liveStatus.value.stream1
	return onAirLight?.on_air_light && isCurrentShowLive1.value
})

const getActualLiveStatus2 = computed(() => {
	const { onAirLight } = liveStatus.value.stream2
	return onAirLight?.on_air_light && isCurrentShowLive2.value
})

// Calculate current title for Stream 1
const getCurrentName1 = computed(() => {
	const { onAirLight, liveData, icecastData } = liveStatus.value.stream1

	if (onAirLight?.on_air_light) {
		if (onAirLight?.master_stream) {
			const title = icecastData?.icestats?.source?.[0]?.title || ''
			return title ? parseString(title) : 'Live Stream 1'
		} else if (liveData?.tracks?.current) {
			if (liveData.tracks.current.metadata) {
				const artist = liveData.tracks.current.metadata.artist_name || ''
				const title = liveData.tracks.current.metadata.track_title || ''

				if (artist && artist !== title) {
					return parseString(`${title} - ${artist}`)
				}
				return parseString(title)
			} else if (liveData.shows?.current) {
				return parseString(
					liveData.shows.current.name.replace(' - Live Stream', '')
				)
			}
		}
	}

	if (liveData?.shows?.next?.length > 0) {
		const nextShow = liveData.shows.next[0]
		const startSplitted = nextShow.starts.split(' ')
		const date = new Date(`${startSplitted[0]}T${startSplitted[1]}Z`)

		const hoursNext = date.getUTCHours()
		const minutesNext =
      date.getUTCMinutes() < 10
      	? '0' + date.getUTCMinutes()
      	: date.getUTCMinutes()

		return `Next (${hoursNext}:${minutesNext}): ${parseString(nextShow.name)}`
	}

	return 'Stream 1'
})

// Calculate current title for Stream 2
const getCurrentName2 = computed(() => {
	const { onAirLight, liveData } = liveStatus.value.stream2

	// Check if there's live streaming first
	if (onAirLight?.on_air_light) {
		if (onAirLight?.master_stream) {
			const title =
        liveStatus.value.stream1.icecastData?.icestats?.source?.[1]?.title ||
        ''
			return title ? parseString(title) : 'Live Stream 2'
		} else if (liveData?.tracks?.current) {
			if (liveData.tracks.current.metadata) {
				const artist = liveData.tracks.current.metadata.artist_name || ''
				const title = liveData.tracks.current.metadata.track_title || ''

				if (artist && artist !== title) {
					return parseString(`${title} - ${artist}`)
				}
				return parseString(title)
			} else if (liveData.shows?.current) {
				return parseString(
					liveData.shows.current.name.replace(' - Live Stream', '')
				)
			}
		}
	}

	// Check for current tracks even when not live (automatic playlist)
	if (liveData?.tracks?.current) {
		if (liveData.tracks.current.metadata) {
			const artist = liveData.tracks.current.metadata.artist_name || ''
			const title = liveData.tracks.current.metadata.track_title || ''

			if (artist && artist !== title) {
				return parseString(`${title} - ${artist}`)
			}
			return parseString(title)
		}
	}

	// Check for current show (non-live shows)
	if (liveData?.shows?.current) {
		return parseString(
			liveData.shows.current.name.replace(' - Live Stream', '')
		)
	}

	if (liveData?.shows?.next?.length > 0) {
		const nextShow = liveData.shows.next[0]
		const startSplitted = nextShow.starts.split(' ')
		const date = new Date(`${startSplitted[0]}T${startSplitted[1]}Z`)

		const hoursNext = date.getUTCHours()
		const minutesNext =
      date.getUTCMinutes() < 10
      	? '0' + date.getUTCMinutes()
      	: date.getUTCMinutes()

		return `Next (${hoursNext}:${minutesNext}): ${parseString(nextShow.name)}`
	}

	return 'Stream 2'
})

// Configure audio elements
const setupAudioElement = (audioElement, num) => {
	if (!audioElement) return

	// Basic configuration
	audioElement.volume = 1.0
	audioElement.preload = 'metadata' // Only preload metadata
	audioElement.crossOrigin = 'anonymous'

	// Event listeners
	audioElement.addEventListener('play', () => {
		if (num === 1) {
			isPlaying1.value = true
			isLoading1.value = false
		} else {
			isPlaying2.value = true
			isLoading2.value = false
		}
	})

	audioElement.addEventListener('waiting', () => {
		if (num === 1) {
			isLoading1.value = true
		} else {
			isLoading2.value = true
		}
	})

	audioElement.addEventListener('pause', () => {
		if (num === 1) {
			isPlaying1.value = false
			isLoading1.value = false
		} else {
			isPlaying2.value = false
			isLoading2.value = false
		}
	})

	audioElement.addEventListener('ended', () => {
		if (num === 1) {
			isPlaying1.value = false
		} else {
			isPlaying2.value = false
		}
	})

	audioElement.addEventListener('error', () => {
		if (num === 1) {
			isPlaying1.value = false
			isLoading1.value = false
		} else {
			isPlaying2.value = false
			isLoading2.value = false
		}
	})

	// Add HLS streaming for better compatibility
	try {
		// Audio streams often have MIME type issues. Fallback to common Icecast server options
		audioElement.addEventListener('canplaythrough', () => {})

		// Prevent automatic start
		audioElement.autoplay = false
	} catch {
		// Silent error handling
	}
}

// Regularly update live status (separate timer)
let statusUpdateInterval = null

// React to visibility changes
const visibility = useDocumentVisibility()

onMounted(() => {
	// Get audio elements after mounting
	audioEl1 = document.getElementById('audioPlayer1')
	audioEl2 = document.getElementById('audioPlayer2')

	// Configure audio elements
	setupAudioElement(audioEl1, 1)
	setupAudioElement(audioEl2, 2)

	// MediaSession API for media control
	if ('mediaSession' in navigator) {
		navigator.mediaSession.setActionHandler('play', () => {
			if (isPlaying1.value && audioEl1) {
				audioEl1.play()
			} else if (isPlaying2.value && audioEl2) {
				audioEl2.play()
			}
		})

		navigator.mediaSession.setActionHandler('pause', () => {
			if (isPlaying1.value && audioEl1) {
				audioEl1.pause()
			} else if (isPlaying2.value && audioEl2) {
				audioEl2.pause()
			}
		})

		// Update metadata when stream changes
		updateMediaSessionMetadata()
	}

	// Initially load status data
	updateLiveStatus()

	// Set up status update timer
	const startInterval = () => {
		if (statusUpdateInterval) clearInterval(statusUpdateInterval)
		statusUpdateInterval = setInterval(() => {
			// Only update if visible
			if (visibility.value === 'visible') {
				updateLiveStatus()

				// Update MediaSession metadata
				if ('mediaSession' in navigator) {
					updateMediaSessionMetadata()
				}
			}
		}, 20000) // Update every 20 seconds (increased from 10s)
	}

	startInterval()

	// Watch visibility to pause/resume strict polling (optional, relying on the check inside interval is safer for simple implementation,
	// but restarting interval on show ensures immediate update)
	watch(visibility, (current, previous) => {
		if (current === 'visible' && previous === 'hidden') {
			updateLiveStatus() // Immediate update when coming back
		}
	})
})

// Update MediaSession metadata based on current stream
const updateMediaSessionMetadata = () => {
	// Wenn SoundCloud abgespielt wird, nicht überschreiben
	if (!('mediaSession' in navigator)) return

	let title = ''
	let artist = ''
	let isLive = false

	// Determine which stream is active
	if (isPlaying1.value) {
		title = getCurrentName1.value
		isLive = liveStatus.value.stream1.onAirLight.on_air_light

		// Try to extract artist if possible
		if (liveStatus.value.stream1.liveData?.tracks?.current?.metadata) {
			title =
        liveStatus.value.stream1.liveData.tracks.current.metadata.track_title ||
        title
			artist =
        liveStatus.value.stream1.liveData.tracks.current.metadata.artist_name ||
        ''
		}
	} else if (isPlaying2.value) {
		title = getCurrentName2.value
		isLive = liveStatus.value.stream2.onAirLight.on_air_light

		// Try to extract artist if possible
		if (liveStatus.value.stream2.liveData?.tracks?.current?.metadata) {
			title =
        liveStatus.value.stream2.liveData.tracks.current.metadata.track_title ||
        title
			artist =
        liveStatus.value.stream2.liveData.tracks.current.metadata.artist_name ||
        ''
		}
	} else {
		// Nothing is playing
		return
	}

	// Use "Live" icon when streaming is active
	const artworkBasePath = isLive
		? 'https://cdn.sanity.io/images'
		: 'https://cdn.sanity.io/images'

	// Update the media session
	navigator.mediaSession.metadata = new MediaMetadata({
		title: title,
		artist: artist || 'Live',
		album: 'callshopradio.com',
		artwork: [
			{
				src: `${artworkBasePath}/0smxd0yv/production/8dec3ac90ca85d49ea0ec988878c7ade73076027-128x128.png`,
				sizes: '128x128',
				type: 'image/png'
			},
			{
				src: `${artworkBasePath}/0smxd0yv/production/39cdeb4fe1f225ef9c95f206e4762a7e5b49c02b-256x256.png`,
				sizes: '256x256',
				type: 'image/png'
			},
			{
				src: `${artworkBasePath}/0smxd0yv/production/b093514befc9ed8545037ebfcba4208c81777878-512x512.png`,
				sizes: '512x512',
				type: 'image/png'
			},
			{
				src: `${artworkBasePath}/0smxd0yv/production/27e8b5ea883c05d7b0d1e6fbb0b79bcced14150e-1024x1024.png`,
				sizes: '1024x1024',
				type: 'image/png'
			}
		]
	})
}

// Clean up timer when removing component
onBeforeUnmount(() => {
	if (statusUpdateInterval) {
		clearInterval(statusUpdateInterval)
	}
})

// Initial call to have data immediately
updateLiveStatus()
</script>

<template>
	<div class="audio-player">
		<div class="audio-player__wrapper">
			<div
				class="audio-player__music-controller track-one"
				:class="{
					active:
						mainStore.activeStreamingChannel === 'channelOne' ||
						(isPlaying1 && mainStore.activeStreamingChannel === 'channelOne') ||
						isLoading1,
					inactive:
						mainStore.activeStreamingChannel === 'channelTwo' ||
						(isPlaying2 && mainStore.activeStreamingChannel === 'channelTwo') ||
						(isPlaying1 && mainStore.activeStreamingChannel === 'channelTwo') ||
						isLoading2,
					offline:
						!getActualLiveStatus1 &&
						!liveStatus.stream1.liveData?.tracks?.current,
				}"
				@click="togglePlay1"
			>
				<h2>1</h2>
				<button>
					<div v-if="isLoading1" class="loading-indicator">
						<span class="dot"/>
						<span class="dot"/>
						<span class="dot"/>
					</div>
					<svg
						v-else-if="isPlaying1"
						class="pause"
						width="8"
						height="10"
						viewBox="0 0 8 10"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect width="3" height="10" />
						<rect
							x="5"
							width="3"
							height="10" />
					</svg>
					<svg
						v-else
						class="play"
						width="9"
						height="12"
						viewBox="0 0 9 12"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M9 6L-4.89399e-07 11.1962L-3.51373e-08 0.803847L9 6Z"
							fill="black"
						/>
					</svg>
				</button>
				<p class="track-name">{{ getCurrentName1 }}</p>
				<p
					:class="`live-indicator ${
						getActualLiveStatus1
							? 'live'
							: liveStatus.stream1.liveData?.tracks?.current
								? 'track'
								: 'offline'
					}`"
				>
					<svg
						v-if="getActualLiveStatus1"
						width="9"
						height="9"
						viewBox="0 0 9 9"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle
							cx="4.5"
							cy="4.5"
							r="4.5"
							fill="black" />
					</svg>
					<svg
						viewBox="0 0 512 512"
						enable-background="new 0 0 512 512"
						xmlns="http://www.w3.org/2000/svg"
						class="broadcast"
					>
						<g>
							<g>
								<g>
									<path
										clip-rule="evenodd"
										d="M415.698,192.641c-8.379-21.068-21.236-40.268-38.577-57.6      l36.309-36.364c26.971,26.989,45.555,57.456,55.745,91.404c6.226,20.683,9.349,42.655,9.367,65.919v0.06      c-0.008,34.011-6.66,65.254-19.957,93.729c-10.701,23.024-25.735,44.24-45.097,63.651l-36.427-36.422      c13.297-13.305,23.948-27.696,31.945-43.171c12.119-23.434,18.17-49.363,18.156-77.788V256      C427.19,233.287,423.372,212.168,415.698,192.641z"
										fill="#333333"
										fill-rule="evenodd"
									/>
								</g>

								<g>
									<path
										clip-rule="evenodd"
										d="M351.69,160.99c8.768,8.825,16.062,18.27,21.88,28.334h0.06      c11.449,19.798,17.17,41.983,17.165,66.56V256c-0.004,25.516-6.152,48.478-18.447,68.889h-0.057      c-5.676,9.334-12.638,18.139-20.892,26.414v-0.06l-0.057,0.06l-36.427-36.423c2.371-2.448,4.562-4.95,6.576-7.505v-0.06      c11.828-14.672,17.763-31.779,17.807-51.315v-0.116c-0.019-22.938-8.124-42.506-24.323-58.705l36.483-36.538      C351.541,160.752,351.618,160.868,351.69,160.99z"
										fill="#333333"
										fill-rule="evenodd"
									/>
								</g>

								<g>
									<path
										clip-rule="evenodd"
										d="M225.829,225.571c8.342-8.35,18.427-12.519,30.259-12.509      c11.851-0.01,21.956,4.159,30.316,12.509l0.059,0.059c8.313,8.348,12.463,18.433,12.451,30.254V256      c-0.016,11.798-4.187,21.863-12.51,30.197c-0.03,0.027-0.048,0.068-0.058,0.116c-8.364,8.272-18.447,12.402-30.259,12.394      c-11.817,0.009-21.884-4.142-30.201-12.452l-0.058-0.058c-8.311-8.317-12.481-18.365-12.511-30.138c0-0.06,0-0.117,0-0.176      c-0.012-11.787,4.121-21.854,12.395-30.196C225.747,225.653,225.786,225.615,225.829,225.571z"
										fill="#333333"
										fill-rule="evenodd"
									/>
								</g>

								<g>
									<path
										clip-rule="evenodd"
										d="M121.265,255.884c-0.006-1.646,0.014-3.273,0.059-4.887      c1.113-35.124,14.225-65.242,39.335-90.356l36.426,36.422c-16.217,16.235-24.306,35.842-24.265,58.821c0,0.059,0,0.116,0,0.176      c-0.015,2.561,0.083,5.084,0.291,7.563v0.057c1.61,19.688,9.602,36.736,23.974,51.143c0.035,0.037,0.073,0.075,0.117,0.116      l-36.485,36.423l-0.058-0.059c-26.237-26.289-39.368-58.037-39.394-95.243C121.265,256,121.265,255.942,121.265,255.884z"
										fill="#333333"
										fill-rule="evenodd"
									/>
								</g>

								<g>
									<path
										clip-rule="evenodd"
										d="M35.437,225.28c6.121-48.44,27.186-90.661,63.192-126.662      l36.425,36.423c-29.26,29.239-45.727,63.78-49.402,103.621c-0.51,5.681-0.763,11.479-0.756,17.397      c0.002,47.206,16.684,87.524,50.042,120.959l0.058,0.059l-36.426,36.421l-0.058-0.058      c-43.359-43.459-65.025-95.92-64.997-157.381C33.521,245.532,34.161,235.271,35.437,225.28z"
										fill="#333333"
										fill-rule="evenodd"
									/>
								</g>
							</g>
						</g>
					</svg>
					{{
						getActualLiveStatus1
							? "Live"
							: liveStatus.stream1.liveData?.tracks?.current
								? ""
								: "Offline"
					}}
				</p>
			</div>
			<div
				class="audio-player__music-controller track-two"
				:class="{
					active:
						mainStore.activeStreamingChannel === 'channelTwo' ||
						(isPlaying2 && mainStore.activeStreamingChannel === 'channelTwo') ||
						isLoading2,
					inactive:
						mainStore.activeStreamingChannel === 'channelOne' ||
						(isPlaying1 && mainStore.activeStreamingChannel === 'channelOne') ||
						(isPlaying2 && mainStore.activeStreamingChannel === 'channelOne') ||
						isLoading1,
					offline:
						!getActualLiveStatus2 &&
						!liveStatus.stream2.liveData?.tracks?.current,
				}"
				@click="togglePlay2"
			>
				<h2>2</h2>
				<button>
					<div v-if="isLoading2" class="loading-indicator">
						<span class="dot"/>
						<span class="dot"/>
						<span class="dot"/>
					</div>
					<svg
						v-else-if="isPlaying2"
						class="pause"
						width="8"
						height="10"
						viewBox="0 0 8 10"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect
							width="3"
							height="10"
							fill="black" />
						<rect
							x="5"
							width="3"
							height="10"
							fill="black" />
					</svg>
					<svg
						v-else
						class="play"
						width="9"
						height="12"
						viewBox="0 0 9 12"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M9 6L-4.89399e-07 11.1962L-3.51373e-08 0.803847L9 6Z"
							fill="black"
						/>
					</svg>
				</button>
				<p class="track-name">{{ getCurrentName2 }}</p>
				<p
					:class="`live-indicator ${
						getActualLiveStatus2
							? 'live'
							: liveStatus.stream2.liveData?.tracks?.current
								? 'track'
								: 'offline'
					}`"
				>
					<svg
						v-if="getActualLiveStatus2"
						width="9"
						height="9"
						viewBox="0 0 9 9"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<circle
							cx="4.5"
							cy="4.5"
							r="4.5"
							fill="black" />
					</svg>

					<svg
						viewBox="0 0 512 512"
						enable-background="new 0 0 512 512"
						xmlns="http://www.w3.org/2000/svg"
						class="broadcast"
					>
						<g>
							<g>
								<g>
									<path
										clip-rule="evenodd"
										d="M415.698,192.641c-8.379-21.068-21.236-40.268-38.577-57.6      l36.309-36.364c26.971,26.989,45.555,57.456,55.745,91.404c6.226,20.683,9.349,42.655,9.367,65.919v0.06      c-0.008,34.011-6.66,65.254-19.957,93.729c-10.701,23.024-25.735,44.24-45.097,63.651l-36.427-36.422      c13.297-13.305,23.948-27.696,31.945-43.171c12.119-23.434,18.17-49.363,18.156-77.788V256      C427.19,233.287,423.372,212.168,415.698,192.641z"
										fill="#333333"
										fill-rule="evenodd"
									/>
								</g>

								<g>
									<path
										clip-rule="evenodd"
										d="M351.69,160.99c8.768,8.825,16.062,18.27,21.88,28.334h0.06      c11.449,19.798,17.17,41.983,17.165,66.56V256c-0.004,25.516-6.152,48.478-18.447,68.889h-0.057      c-5.676,9.334-12.638,18.139-20.892,26.414v-0.06l-0.057,0.06l-36.427-36.423c2.371-2.448,4.562-4.95,6.576-7.505v-0.06      c11.828-14.672,17.763-31.779,17.807-51.315v-0.116c-0.019-22.938-8.124-42.506-24.323-58.705l36.483-36.538      C351.541,160.752,351.618,160.868,351.69,160.99z"
										fill="#333333"
										fill-rule="evenodd"
									/>
								</g>

								<g>
									<path
										clip-rule="evenodd"
										d="M225.829,225.571c8.342-8.35,18.427-12.519,30.259-12.509      c11.851-0.01,21.956,4.159,30.316,12.509l0.059,0.059c8.313,8.348,12.463,18.433,12.451,30.254V256      c-0.016,11.798-4.187,21.863-12.51,30.197c-0.03,0.027-0.048,0.068-0.058,0.116c-8.364,8.272-18.447,12.402-30.259,12.394      c-11.817,0.009-21.884-4.142-30.201-12.452l-0.058-0.058c-8.311-8.317-12.481-18.365-12.511-30.138c0-0.06,0-0.117,0-0.176      c-0.012-11.787,4.121-21.854,12.395-30.196C225.747,225.653,225.786,225.615,225.829,225.571z"
										fill="#333333"
										fill-rule="evenodd"
									/>
								</g>

								<g>
									<path
										clip-rule="evenodd"
										d="M121.265,255.884c-0.006-1.646,0.014-3.273,0.059-4.887      c1.113-35.124,14.225-65.242,39.335-90.356l36.426,36.422c-16.217,16.235-24.306,35.842-24.265,58.821c0,0.059,0,0.116,0,0.176      c-0.015,2.561,0.083,5.084,0.291,7.563v0.057c1.61,19.688,9.602,36.736,23.974,51.143c0.035,0.037,0.073,0.075,0.117,0.116      l-36.485,36.423l-0.058-0.059c-26.237-26.289-39.368-58.037-39.394-95.243C121.265,256,121.265,255.942,121.265,255.884z"
										fill="#333333"
										fill-rule="evenodd"
									/>
								</g>

								<g>
									<path
										clip-rule="evenodd"
										d="M35.437,225.28c6.121-48.44,27.186-90.661,63.192-126.662      l36.425,36.423c-29.26,29.239-45.727,63.78-49.402,103.621c-0.51,5.681-0.763,11.479-0.756,17.397      c0.002,47.206,16.684,87.524,50.042,120.959l0.058,0.059l-36.426,36.421l-0.058-0.058      c-43.359-43.459-65.025-95.92-64.997-157.381C33.521,245.532,34.161,235.271,35.437,225.28z"
										fill="#333333"
										fill-rule="evenodd"
									/>
								</g>
							</g>
						</g>
					</svg>

					{{
						getActualLiveStatus2
							? "Live"
							: liveStatus.stream2.liveData?.tracks?.current
								? ""
								: "Offline"
					}}
				</p>
			</div>
		</div>

		<!-- Audio elements completely outside Vue's reactivity system -->
		<audio id="audioPlayer1" :src="streamUrl1"/>
		<audio id="audioPlayer2" :src="streamUrl2"/>
	</div>
</template>

<style scoped lang="postcss">
.audio-player {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
  align-items: flex-start;
  padding: var(--small-padding) 0;

  &__wrapper {
    display: flex;
    flex-flow: row wrap;
    justify-content: center;
    width: 100%;
  }

  &__music-controller {
    display: flex;
    flex-flow: row;
    justify-content: flex-start;
    align-items: center;
    gap: var(--small-padding);
    max-width: calc(var(--page-max-width) / 2);
    width: 50%;
    transition: width 0.15s ease, max-width 0.15s ease;
    cursor: pointer;
    @media screen and (max-width: 1100px) {
      width: 100%;
      max-width: 100%;
    }
    svg {
      height: var(--base-font-size);
      &.broadcast {
        transform: scale(1.5);
      }
    }
    &.offline {
      cursor: not-allowed !important;
      pointer-events: none;
      .live-indicator {
        color: var(--color-dark-grey);
      }
      color: var(--color-dark-grey);
      button {
        cursor: not-allowed !important;
        pointer-events: none;
        svg {
          rect,
          path {
            fill: var(--color-dark-grey);
            opacity: 0.66;
            @media (prefers-color-scheme: dark) {
              fill: var(--color-dark-grey);
              opacity: 1;
            }
          }
        }
      }
    }
    button {
      display: flex;
      flex-flow: row wrap;
      justify-content: center;
      align-items: center;
      margin: 0 var(--big-padding) 0 0;
      color: transparent;
      background-color: transparent;
      border: none;

      svg {
        rect,
        path {
          fill: var(--color-text);
        }
      }

      .loading-indicator {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;

        .dot {
          display: inline-block;
          width: 4px;
          height: 4px;
          background-color: var(--color-pink);
          border-radius: 50%;
          animation: dotPulse 1.5s infinite ease-in-out;

          &:nth-child(1) {
            animation-delay: 0s;
          }

          &:nth-child(2) {
            animation-delay: 0.2s;
          }

          &:nth-child(3) {
            animation-delay: 0.4s;
          }
        }
      }
    }
    h2 {
      font-size: var(--base-font-size);
      font-family: var(--font-text-semibold);
    }
    p {
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      text-transform: uppercase;
      font-family: var(--font-text-semibold);
      &.live-indicator {
        display: flex;
        flex-flow: row;
        align-items: center;
        gap: var(--small-padding);
        letter-spacing: var(--menu-letter-spacing);
        svg {
          height: var(--base-font-size);
          height: var(--base-font-size);
          circle {
            fill: var(--color-pink);
          }
          fill: var(--color-pink);
        }
        overflow: visible;
        text-overflow: clip;
        text-transform: uppercase;
        margin: 0 0 0 auto;
        line-height: var(--base-line-height);

        /* Live status - pink */
        &.live {
          color: var(--color-pink);
        }

        /* Track status - normal text color */
        &.track {
          color: var(--color-text);
        }

        /* Offline status - grey */
        &.offline {
          color: var(--color-dark-grey);
        }
      }
    }
    &.track-one {
      padding: 0 var(--big-padding) 0 0;
      border-right: 1px solid var(--color-text);
      @media screen and (max-width: 900px) {
        padding: 0 var(--base-padding);
        border-right: none;
      }
    }
    &.track-two {
      padding: 0 0 0 var(--big-padding);
      @media screen and (max-width: 900px) {
        padding: 0 var(--base-padding);
      }
    }
    &.active {
      max-width: calc(var(--page-max-width) / 1.5);
      width: 75%;
      opacity: 1;
      @media screen and (max-width: 900px) {
        display: flex;
        width: 100%;
        max-width: 100%;
      }

      svg {
        rect,
        path {
          fill: var(--color-pink);
        }
      }
    }
    &.inactive {
      max-width: calc(var(--page-max-width) / 3);
      width: 25%;
      opacity: 0.33;
      @media screen and (max-width: 900px) {
        display: none;
        opacity: 1;
      }
    }
  }

  /* Audio-Elemente verstecken */
  audio {
    display: none;
  }
}

@keyframes dotPulse {
  0%,
  80%,
  100% {
    transform: scale(0);
    opacity: 0;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>