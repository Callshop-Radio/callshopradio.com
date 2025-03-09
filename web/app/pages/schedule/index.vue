<template>
  <div>
    <Head>
      <Title>Callshop Radio - Schedule</Title>
      <Meta
        name="description"
        content="Stay up to date with our Schedule and don't miss any!"
      />
    </Head>

    <!-- <div v-if="pending">Loading...</div>
    <div v-else-if="error">Error loading schedule data.</div>
    <div v-else>
      <h2>Live Shows Düsseldorf</h2>
      <div v-if="liveShows.length === 0">No live shows in Düsseldorf.</div>
      <ul v-else>
        <li v-if="liveShows?.shows?.current">
          <strong>{{ liveShows?.shows?.current?.name }}</strong><br />
          Start: {{ formatDate(liveShows?.shows?.current?.starts) }}<br />
          End: {{ formatDate(liveShows?.shows?.current?.ends) }}
        </li>
        <li v-for="(show, index) in liveShows?.shows?.next" :key="index">
          <strong>{{ show.name }}</strong><br />
          Start: {{ formatDate(show.starts) }}<br />
          End: {{ formatDate(show.ends) }}
        </li>
      </ul>

      <h2>Live Shows Wien</h2>
      <div v-if="liveShowsWien.length === 0">No live shows in Wien.</div>
      <ul v-else>
        <li v-if="liveShowsWien?.shows?.current">
          <strong>{{ liveShowsWien?.shows?.current?.name }}</strong><br />
          Start: {{ formatDate(liveShowsWien?.shows?.current?.starts) }}<br />
          End: {{ formatDate(liveShowsWien?.shows?.current?.ends) }}
        </li>
        <li v-for="(show, index) in liveShowsWien?.shows?.next" :key="index">
          <strong>{{ show.name }}</strong><br />
          Start: {{ formatDate(show.starts) }}<br />
          End: {{ formatDate(show.ends) }}
        </li>
      </ul>

      <h2>On-Air Light Status</h2>
      <div v-if="onAirLight">
        <p><strong>Status:</strong> {{ onAirLight.on_air_light ? 'Live' : 'Offline' }}</p>
      </div>
      <div v-else>
        <p>No On-Air Light data available.</p>
      </div>
    </div>
  </div> -->
</template>

<script setup>
// const apiKey = process.env.NUXT_LIBRETIME_API_KEY;

// // Hilfsfunktion für API-Aufrufe mit Authorization-Header
// const fetcher = async (url) => {
//   const response = await fetch(url, {
//     headers: {
//       'Authorization': `Api-Key ${apiKey}`,
//       'Content-Type': 'application/json',
//     },
//   });
//   if (!response.ok) throw new Error(`Error fetching data: ${response.statusText}`);
//   return await response.json();
// };

// // Daten asynchron laden
// const { data, pending, error } = await useAsyncData('scheduleData', async () => {
//   const liveInfoUrl = 'https://libretime.callshopradio.com/api/live-info-v2';
//   const liveInfoWienUrl = 'https://wien.callshopradio.com/api/live-info-v2?days=7';
//   const onAirLightUrl = `https://libretime.callshopradio.com/api/on-air-light/format/json?api_key=${apiKey}`;

//   const [liveInfo, liveInfoWien, onAirLight] = await Promise.all([
//     fetcher(liveInfoUrl),
//     fetcher(liveInfoWienUrl),
//     fetcher(onAirLightUrl),
//   ]);

//   return {
//     liveShows: liveInfo,
//     liveShowsWien: liveInfoWien,
//     onAirLight: onAirLight,
//   };
// });

// // Daten aus der API-Antwort extrahieren
// const liveShows = data.value?.liveShows || [];
// const liveShowsWien = data.value?.liveShowsWien || [];
// const onAirLight = data.value?.onAirLight || null;

// // console.log(onAirLight);


// // Hilfsfunktion zur Formatierung von Datumsangaben
// const formatDate = (dateString) => {
//   return new Date(dateString).toLocaleString();
// };
</script>

<style scoped>
h2 {
  margin-top: 2rem;
  color: #333;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  background: #f4f4f4;
  margin-bottom: 1rem;
  padding: 1rem;
  border-left: 5px solid #2196f3;
}

li strong {
  font-size: 1.2rem;
}

li + li {
  border-top: 1px solid #ddd;
}

p {
  background: #f4f4f4;
  padding: 1rem;
  border-left: 5px solid #ff5722;
}
</style>
