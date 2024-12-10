<template>
    <div>
      <h2>Kalender</h2>
      <div v-if="events.length === 0">Loading...</div>
      <ul v-else>
        <li v-for="(event, index) in events" :key="index">
          <strong>{{ event.title }}</strong> (Start: {{ event.start }})
        </li>
      </ul>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  
  const props = defineProps({
    liveShows: Array,
    liveShowsWien: Array,
    instances: Array,
  });
  
  const events = ref([]);
  
  // Events kombinieren
  onMounted(() => {
    events.value = [...props.liveShows, ...props.liveShowsWien];
  });
  </script>
  