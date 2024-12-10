<template>
    <div v-if="windowSize.width !== undefined && eventsToShow.length > 0" class="main-calendar">
      <FullCalendar
        ref="calendar"
        :options="calendarOptions"
      />
    </div>
    <div v-else class="main-calendar">
      <h1>Loading....</h1>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, reactive, computed, watch } from 'vue';
  import FullCalendar from '@fullcalendar/vue3';
  import timeGridPlugin from '@fullcalendar/timegrid';
  import axios from 'axios';
  import useSWRV from 'swrv';
  
  // Props
  const props = defineProps({
    instances: Array,
    liveShows: Array,
    liveShowsWien: Array,
    reproState: Object
  });
  
  // Zustand
  const calendar = ref(null);
  const showWienCalendar = ref('all');
  const eventsToShow = ref([]);
  const windowSize = reactive({ width: undefined, height: undefined });
  
  // Fetch-Funktion für SWRV
  const fetcher = (url) => axios.get(url).then((res) => res.data);
  
  // Hilfsfunktion zur String-Formatierung
  const parseString = (string) => {
    return string.replace("&amp;", "&").replace("&gt;", ">").replace("&lt;", "<").replace("&quot;", '"');
  };
  
  // Kalender-Initialisierung
  const init = async () => {
    const mounted = ref(false);
  
    onMounted(() => {
      mounted.value = true;
    });
  
    let newEvents = await Promise.all(
      props.instances.map(async (value) => {
        if (mounted.value) {
          const { data } = await fetcher(`https://libretime.callshopradio.com/api/show-tracks/?instance_id=${value}`);
          return data;
        }
      })
    );
  
    let returnArray = [];
    newEvents.forEach((value) => {
      Object.values(value).forEach((item) => {
        if (item.length && item !== '2.0') {
          returnArray.push(item);
        }
      });
    });
  
    return returnArray.map((value) => {
      let title = value.artist ? `${value.title} - ${value.artist}` : value.title;
      title += value.year !== '0' ? ' (R)' : '';
  
      let start = value.starts.split(" ").join("T") + 'Z';
      let length = value.cue_out.split(":");
      let seconds = length.length > 2
        ? (length[0] * 3600 + length[1] * 60 + (+length[2])) * 1000
        : (length[0] * 60 + (+length[1])) * 1000;
  
      let end = new Date(new Date(start).getTime() + seconds);
  
      return {
        title: parseString(title),
        start: new Date(start).toISOString(),
        end: end.toISOString(),
        classNames: ['blue']
      };
    });
  };
  
  // Wien-Kalender-Initialisierung
  const initWien = () => {
    return props.liveShowsWien.map((value) => {
      let title = value.instance_description ? `${value.title} - ${value.instance_description}` : value.title;
      let start = value.start.split(" ").join("T") + 'Z';
      let end = value.end.split(" ").join("T") + 'Z';
  
      return {
        title: parseString("#2: " + title),
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        classNames: ['rosa']
      };
    });
  };
  
  // Kalenderoptionen
  const calendarOptions = computed(() => ({
    plugins: [timeGridPlugin],
    initialView: windowSize.width < 900 ? 'timeGridDay' : 'timeGridWeek',
    allDaySlot: false,
    nowIndicator: true,
    expandRows: true,
    eventOrder: "title",
    firstDay: 1,
    slotEventOverlap: false,
    scrollTime: false,
    timeZone: 'UTC',
    events: eventsToShow.value,
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
      hour12: false
    },
    slotLabelFormat: {
      hour: '2-digit',
      minute: '2-digit',
      meridiem: false,
      hour12: false
    },
    headerToolbar: {
      left: windowSize.width < 900 ? 'prev' : 'title',
      center: windowSize.width < 900 ? 'title' : '',
      right: windowSize.width < 900 ? 'next' : 'today prev,next timeGridWeek,timeGridDay',
    }
  }));
  
  // Fenstergröße überwachen
  const updateWindowSize = () => {
    windowSize.width = window.innerWidth;
    windowSize.height = window.innerHeight;
  
    if (calendar.value) {
      if (window.innerWidth < 900) {
        calendar.value.getApi().changeView('timeGridDay');
      } else {
        calendar.value.getApi().changeView('timeGridWeek');
      }
    }
  };
  
  onMounted(() => {
    window.addEventListener('resize', updateWindowSize);
    updateWindowSize();
  });
  
  onMounted(async () => {
    const events = await init();
    const wienEvents = initWien();
    eventsToShow.value = [...events, ...wienEvents];
  });
  </script>
  
  <style scoped>
  .main-calendar {
    margin: 20px;
  }
  </style>
  