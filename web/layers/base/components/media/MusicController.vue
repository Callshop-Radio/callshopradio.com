<template>
    <div v-if="pending" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error loading stream data.</div>
    <div v-else class="music-controller">
      <div class="stream-status">
        <p><strong>Status:</strong> {{ onAirLight.on_air_light ? 'Live' : 'Offline' }}</p>
      </div>
  
      <div class="current-track">
        <p v-if="currentName"><strong>Now Playing:</strong> {{ currentName }}</p>
      </div>
  
      <div class="controls">
        <button @click="togglePlay">
          {{ isPlaying ? 'Stop Stream' : 'Play Stream' }}
        </button>
      </div>
  
      <audio ref="audioPlayer" :src="streamUrl" preload="none"></audio>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue';
    // API-Keys aus Umgebungsvariablen
    const apiKey = process.env.NUXT_LIBRETIME_API_KEY;

  // Hilfsfunktion für API-Aufrufe
  const fetcher = async (url, apiKey = null) => {
    try {
      const headers = apiKey
        ? { 'Authorization': `Api-Key ${apiKey}`, 'Content-Type': 'application/json' }
        : {};
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`Error fetching data: ${response.statusText}`);
      return await response.json();
    } catch (err) {
      console.error('Fetch error:', err);
      return null;
    }
  };
  
  // Stetige Refresh-Logik mit useAsyncData
  const { data, pending, error } = await useAsyncData(
    'liveData',
    async () => {
      const liveInfoUrl = 'https://libretime.callshopradio.com/api/live-info-v2';
      const onAirLightUrl = `https://libretime.callshopradio.com/api/on-air-light/format/json?api_key=${apiKey}`;
  
      const [liveData, onAirLight] = await Promise.all([
        fetcher(liveInfoUrl),
        fetcher(onAirLightUrl),
      ]);
  
      return { liveData, onAirLight };
    },
    { refreshInterval: 5000 }
  );
  
  // Extrahiere die Daten
  const onAirLight = computed(() => data.value?.onAirLight || {});
  const liveData = computed(() => data.value?.liveData || {});
  
  // Bestimme die richtige Stream-URL (Live-Stream oder Master-Stream)
  const streamUrl = computed(() => {
    return liveData.value?.live_stream || liveData.value?.master_stream || '';
  });
  
  const audioPlayer = ref(null);
  const isPlaying = ref(false);
  
  // Funktion zum Abspielen und Stoppen des Streams
  const togglePlay = () => {
    if (!audioPlayer.value) return;
  
    if (isPlaying.value) {
      audioPlayer.value.pause();
      isPlaying.value = false;
    } else {
      audioPlayer.value.play().catch((err) => {
        console.error('Error playing stream:', err);
      });
      isPlaying.value = true;
    }
  };
  
  // Berechne den aktuellen Titel
  const currentName = computed(() => {
    if (onAirLight.value?.on_air_light && liveData.value?.tracks?.current) {
      return liveData.value.tracks.current.metadata?.track_title || liveData.value.tracks.current.name;
    }
    return '';
  });
  </script>
  
  <style scoped>
  .music-controller {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 8px;
    text-align: center;
  }
  
  .stream-status p {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #ff5722;
  }
  
  .current-track p {
    font-size: 1.2rem;
    margin-bottom: 1rem;
  }
  
  .controls button {
    padding: 1rem 2rem;
    font-size: 1rem;
    background-color: #2196f3;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .controls button:hover {
    background-color: #1976d2;
  }
  
  .loading,
  .error {
    text-align: center;
    font-size: 1.5rem;
    color: #ff5722;
  }
  </style>
  