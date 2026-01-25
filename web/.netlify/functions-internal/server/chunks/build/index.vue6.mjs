import { u as useMainStore, r as useThrottleFn, _ as _export_sfc, s as SCHEDULE_QUERY, g as groq, a as useHead, h as __nuxt_component_2 } from './server.mjs';
import { defineComponent, ref, computed, watch, mergeProps, unref, useSSRContext, withAsyncContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderStyle, ssrRenderComponent } from 'vue/server-renderer';
import emblaCarouselVue from 'embla-carousel-vue';
import { u as useCachedSanityQuery, a as usePageSeo } from './usePageSeo.mjs';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'lru-cache';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import '@sanity/client';
import 'vue-router';
import '@sanity/client/csm';
import '@sanity/visual-editing-csm';
import '@sanity/image-url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'unhead/plugins';
import 'unhead/utils';
import 'devalue';
import 'unlazy';
import 'hls.js';

const GRID_START_HOUR = 7;
const GRID_END_HOUR = 24;
const GRID_SEGMENTS_PER_HOUR = 2;
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "ModuleScheduleSlider",
  __ssrInlineRender: true,
  props: {
    groups: {},
    formatDate: { type: Function },
    getShowTitle: { type: Function },
    getShowStart: { type: Function },
    getShowEnd: { type: Function },
    formatTimeRange: { type: Function },
    getShowDescription: { type: Function },
    isLiveShow: { type: Function }
  },
  setup(__props) {
    const mainStore = useMainStore();
    const props = __props;
    const [emblaNode, emblaApi] = emblaCarouselVue({
      align: "start",
      containScroll: false
    });
    const currentSlideIndex = ref(0);
    const canScrollPrev = ref(false);
    const canScrollNext = ref(true);
    const currentTime = ref(/* @__PURE__ */ new Date());
    ref(null);
    computed(() => {
      const hours = currentTime.value.getHours().toString().padStart(2, "0");
      const minutes = currentTime.value.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    });
    const currentTimeIndicatorStyle = computed(() => {
      const now = currentTime.value;
      const hours = now.getHours();
      const minutes = now.getMinutes();
      if (hours < GRID_START_HOUR || hours >= GRID_END_HOUR) {
        return { display: "none" };
      }
      const decimalHours = hours - GRID_START_HOUR + minutes / 60;
      const segments = decimalHours * GRID_SEGMENTS_PER_HOUR;
      const gridRow = Math.floor(segments) + 1;
      const segmentFraction = segments - Math.floor(segments);
      const offsetPercentage = segmentFraction * 100;
      return {
        gridRow: `${gridRow}`,
        gridColumn: "1",
        position: "relative",
        top: `${offsetPercentage}%`,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        width: "100%",
        zIndex: 20,
        pointerEvents: "none",
        marginLeft: "var(--small-padding)"
      };
    });
    const shouldShowTimeMarkerForDate = (date) => {
      const now = currentTime.value;
      const targetDate = new Date(date);
      return now.getDate() === targetDate.getDate() && now.getMonth() === targetDate.getMonth() && now.getFullYear() === targetDate.getFullYear();
    };
    const GRID_TOTAL_HOURS = GRID_END_HOUR - GRID_START_HOUR;
    const GRID_TOTAL_SEGMENTS = Math.min(
      GRID_TOTAL_HOURS * GRID_SEGMENTS_PER_HOUR,
      35
    );
    const parseTrackLength = (length) => {
      const parts = length.split(":");
      if (parts.length === 3) {
        return {
          hours: parseInt(parts[0] || "0", 10) || 0,
          minutes: parseInt(parts[1] || "0", 10) || 0,
          seconds: parseFloat(parts[2] || "0") || 0
        };
      } else if (parts.length === 2) {
        return {
          hours: 0,
          minutes: parseInt(parts[0] || "0", 10) || 0,
          seconds: parseFloat(parts[1] || "0") || 0
        };
      }
      return { hours: 0, minutes: 0, seconds: 0 };
    };
    const calculateTrackEndTime = (track) => {
      if (!track.starts) return null;
      const startTime = new Date(track.starts);
      if (track.cue_out) {
        const { hours, minutes, seconds } = parseTrackLength(track.cue_out);
        if (hours > 0 || minutes > 0 || seconds > 0) {
          const endTime = new Date(startTime.getTime());
          endTime.setHours(endTime.getHours() + hours);
          endTime.setMinutes(endTime.getMinutes() + minutes);
          endTime.setSeconds(endTime.getSeconds() + Math.floor(seconds));
          return endTime;
        }
      }
      if (track.length) {
        const { hours, minutes, seconds } = parseTrackLength(track.length);
        const endTime = new Date(startTime.getTime());
        endTime.setHours(endTime.getHours() + hours);
        endTime.setMinutes(endTime.getMinutes() + minutes);
        endTime.setSeconds(endTime.getSeconds() + Math.floor(seconds));
        return endTime;
      }
      return startTime;
    };
    const formatTrackTime = (dateTime) => {
      if (!dateTime || isNaN(dateTime.getTime())) return "";
      const hours = dateTime.getHours().toString().padStart(2, "0");
      const minutes = dateTime.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    };
    const getTrackTimeRange = (track) => {
      if (!track.starts) return "";
      const startTime = new Date(track.starts);
      const endTime = calculateTrackEndTime(track);
      const startFormatted = formatTrackTime(startTime);
      if (!endTime) return startFormatted;
      const endFormatted = formatTrackTime(endTime);
      return `${startFormatted} – ${endFormatted}`;
    };
    const timeToGridSegment = (date) => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const decimalHours = hours - GRID_START_HOUR + minutes / 60;
      const segments = Math.floor(decimalHours * GRID_SEGMENTS_PER_HOUR);
      return Math.max(0, Math.min(segments, GRID_TOTAL_SEGMENTS - 1));
    };
    const calculateShowDurationInSegments = (startTime, endTime) => {
      const startSegment = timeToGridSegment(startTime);
      let endHours = endTime.getHours();
      let endMinutes = endTime.getMinutes();
      if (endHours === 0 && endMinutes === 0) {
        endHours = 24;
        endMinutes = 0;
      }
      let endDecimalHours = endHours - GRID_START_HOUR + endMinutes / 60;
      if (endDecimalHours > GRID_TOTAL_HOURS) {
        endDecimalHours = GRID_TOTAL_HOURS;
      }
      const endSegment = Math.floor(endDecimalHours * GRID_SEGMENTS_PER_HOUR);
      const clampedEndSegment = Math.max(
        0,
        Math.min(endSegment, GRID_TOTAL_SEGMENTS)
      );
      const durationSegments = clampedEndSegment - startSegment;
      console.log(`🧮 Duration Calculation:`, {
        startTime: startTime.toLocaleTimeString(),
        originalEndTime: endTime.toLocaleTimeString(),
        calculatedEndHours: endHours,
        endDecimalHours,
        startSegment,
        endSegment,
        clampedEndSegment,
        durationSegments,
        endTimeWasMidnight: endTime.getHours() === 0 && endTime.getMinutes() === 0
      });
      return Math.max(1, durationSegments);
    };
    const calculateItemDurationInSegments = (item) => {
      if (item.type === "show") {
        return calculateShowDurationInSegments(item.startTime, item.endTime);
      } else {
        return calculateShowDurationInSegments(item.startTime, item.endTime);
      }
    };
    const processedItems = computed(() => {
      var _a, _b, _c;
      if (!((_a = props.groups) == null ? void 0 : _a.length)) return /* @__PURE__ */ new Map();
      const itemsByDate = /* @__PURE__ */ new Map();
      for (const group of props.groups) {
        const dateKey = new Date(group.date).toDateString();
        const items = [];
        for (const show of group.shows) {
          const description = props.getShowDescription(show);
          if (((_b = show.tracks) == null ? void 0 : _b.length) > 0) ;
          if ((description == null ? void 0 : description.toLowerCase()) === "live") {
            const showStartTime = new Date(props.getShowStart(show));
            const showEndTime = new Date(props.getShowEnd(show));
            console.log(`📺 Live Show Duration:`, {
              title: props.getShowTitle(show),
              start: showStartTime,
              end: showEndTime,
              startFormatted: showStartTime.toLocaleTimeString(),
              endFormatted: showEndTime.toLocaleTimeString(),
              durationHours: (showEndTime.getTime() - showStartTime.getTime()) / (1e3 * 60 * 60),
              crossesMidnight: showEndTime.getTime() < showStartTime.getTime()
            });
            items.push({
              type: "show",
              id: show.id || `show-${show.name}-${props.getShowStart(show)}`,
              title: props.getShowTitle(show),
              startTime: showStartTime,
              endTime: showEndTime,
              formattedTime: props.formatTimeRange(
                props.getShowStart(show),
                props.getShowEnd(show),
                false
              ),
              date: group.date,
              isLive: props.isLiveShow(show)
            });
          }
          if ((_c = show.tracks) == null ? void 0 : _c.length) {
            for (const track of show.tracks) {
              if (!(track == null ? void 0 : track.title)) continue;
              const startTime = track.starts ? new Date(track.starts) : null;
              const endTime = calculateTrackEndTime(track);
              if (startTime) {
                console.log(`🎵 Processing track:`, {
                  title: track.title,
                  startTime,
                  endTime,
                  rawStarts: track.starts,
                  rawLength: track.length,
                  calculatedDuration: endTime ? (endTime.getTime() - startTime.getTime()) / 1e3 / 60 : null
                });
              }
              if (startTime) {
                items.push({
                  type: "track",
                  id: track.id || `track-${track.title}-${startTime.getTime()}`,
                  title: track.title,
                  artist: track.artist || track.creator || track.performer || null,
                  startTime,
                  endTime: endTime || startTime,
                  formattedTime: getTrackTimeRange(track),
                  date: group.date
                });
              }
            }
          }
        }
        const filteredItems = items.filter((item) => {
          const startHour = item.startTime.getHours() + item.startTime.getMinutes() / 60;
          const endHour = item.endTime.getHours() + item.endTime.getMinutes() / 60;
          return startHour >= GRID_START_HOUR && startHour < GRID_END_HOUR || endHour > GRID_START_HOUR && startHour < GRID_END_HOUR;
        }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
        itemsByDate.set(dateKey, filteredItems);
      }
      return itemsByDate;
    });
    const getItemsForDay = (date) => {
      const dateKey = new Date(date).toDateString();
      return processedItems.value.get(dateKey) || [];
    };
    const getItemGridPosition = (item) => {
      const startSegment = timeToGridSegment(item.startTime);
      const durationSegments = calculateItemDurationInSegments(item);
      const gridPosition = {
        gridRowStart: startSegment + 1,
        // CSS Grid ist 1-indexed
        gridRowEnd: startSegment + durationSegments + 1,
        gridColumn: 1
      };
      if (item.type === "show") {
        console.log(`📍 Grid Position for Show:`, {
          title: item.title,
          startTime: item.startTime.toLocaleTimeString(),
          endTime: item.endTime.toLocaleTimeString(),
          startSegment,
          durationSegments,
          gridRowStart: gridPosition.gridRowStart,
          gridRowEnd: gridPosition.gridRowEnd
        });
      }
      return gridPosition;
    };
    useThrottleFn(() => {
    }, 100);
    watch(
      () => props.groups,
      () => {
        var _a, _b, _c;
        if (emblaApi.value) {
          emblaApi.value.reInit();
          currentSlideIndex.value = ((_a = emblaApi.value) == null ? void 0 : _a.selectedScrollSnap()) || 0;
          canScrollPrev.value = ((_b = emblaApi.value) == null ? void 0 : _b.canScrollPrev()) || false;
          canScrollNext.value = ((_c = emblaApi.value) == null ? void 0 : _c.canScrollNext()) || false;
        }
      },
      { deep: true }
    );
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "module-schedule-slider" }, _attrs))} data-v-86d7ef92><div class="navigation-controls" data-v-86d7ef92><div class="location-switch" data-v-86d7ef92><button class="${ssrRenderClass([
        "location-switch__btn",
        {
          "location-switch__btn--active": unref(mainStore).activeScheduleLocation === "channelOne"
        }
      ])}" data-v-86d7ef92> CH1 </button><button class="${ssrRenderClass([
        "location-switch__btn",
        {
          "location-switch__btn--active": unref(mainStore).activeScheduleLocation === "channelTwo"
        }
      ])}" data-v-86d7ef92> CH2 </button></div><div class="dot-navigation" data-v-86d7ef92><!--[-->`);
      ssrRenderList(props.groups, (_, index) => {
        _push(`<button class="${ssrRenderClass([{ active: currentSlideIndex.value === index }, "dot"])}"${ssrRenderAttr("aria-label", `Tag ${index + 1} von ${props.groups.length}`)} data-v-86d7ef92></button>`);
      });
      _push(`<!--]--></div><div class="arrow-navigation" data-v-86d7ef92><button class="${ssrRenderClass([{ disabled: !canScrollPrev.value }, "nav-button prev-button"])}"${ssrIncludeBooleanAttr(!canScrollPrev.value) ? " disabled" : ""} aria-label="Vorheriger Tag" data-v-86d7ef92><svg width="22" height="20" viewBox="0 0 22 20" fill="none" data-v-86d7ef92><path d="M1.67986e-07 9.84832L21.1305 0.452866L21.1305 19.2438L1.67986e-07 9.84832Z" fill="black" data-v-86d7ef92></path></svg></button><button class="${ssrRenderClass([{ disabled: !canScrollNext.value }, "nav-button next-button"])}"${ssrIncludeBooleanAttr(!canScrollNext.value) ? " disabled" : ""} aria-label="Nächster Tag" data-v-86d7ef92><svg width="22" height="20" viewBox="0 0 22 20" fill="none" data-v-86d7ef92><path d="M22 9.84894L0.86951 19.2444L0.869511 0.453482L22 9.84894Z" fill="black" data-v-86d7ef92></path></svg></button></div></div><div class="schedule__content" data-v-86d7ef92><div class="schedule__slider-column" data-v-86d7ef92><section class="embla schedule__city" data-v-86d7ef92>`);
      if (props.groups.length > 0) {
        _push(`<div class="embla__container show-days" data-v-86d7ef92><!--[-->`);
        ssrRenderList(props.groups, (group, index) => {
          _push(`<div class="${ssrRenderClass([{
            "show-day--today": group.isToday,
            "embla__slide--active": currentSlideIndex.value === index
          }, "show-day embla__slide"])}" data-v-86d7ef92><h3 class="show-day__heading" data-v-86d7ef92>`);
          if (group.isToday) {
            _push(`<span class="today-badge" data-v-86d7ef92>Today</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(` ${ssrInterpolate(props.formatDate(group.date, false))}</h3><div class="day-content" data-v-86d7ef92><div class="day-content__events-column" data-v-86d7ef92><div class="events" data-v-86d7ef92><div class="events-grid" data-v-86d7ef92>`);
          if (shouldShowTimeMarkerForDate(group.date)) {
            _push(`<div class="current-time-marker" style="${ssrRenderStyle(currentTimeIndicatorStyle.value)}" data-v-86d7ef92><div class="current-time-marker__pulse" data-v-86d7ef92></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<!--[-->`);
          ssrRenderList(getItemsForDay(group.date), (item, itemIndex) => {
            _push(`<div class="${ssrRenderClass([{
              "event-item--show": item.type === "show",
              "event-item--track": item.type === "track",
              "event-item--live-show": item.type === "show" && item.isLive
            }, "event-item"])}" style="${ssrRenderStyle(getItemGridPosition(item))}" data-v-86d7ef92><div class="${ssrRenderClass([{ live: item.isLive }, "event-item__content"])}" data-v-86d7ef92><h4 class="event-item__time" data-v-86d7ef92>${ssrInterpolate(item.formattedTime)}</h4><h2 class="event-item__title" data-v-86d7ef92>`);
            if (item.type === "show" && item.isLive) {
              _push(`<span class="live-indicator" data-v-86d7ef92>LIVE</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(` ${ssrInterpolate(item.title)}</h2>`);
            if (item.type === "track" && item.artist) {
              _push(`<h3 class="event-item__artist" data-v-86d7ef92> with ${ssrInterpolate(item.artist)}</h3>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div></div></div></div></div>`);
        });
        _push(`<!--]--></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</section></div></div></div>`);
    };
  }
});

const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../layers/base/components/modules/ModuleScheduleSlider.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["__scopeId", "data-v-86d7ef92"]]), { __name: "ModuleScheduleSlider" });

function useScheduleService() {
  const apiKey = process.env.NUXT_LIBRETIME_API_KEY;
  const weekInfoData = ref({});
  const weekInfoWienData = ref({});
  const scheduleData = ref([]);
  const fetcher = async (url) => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Api-Key ${apiKey}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`Error fetching data: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      return null;
    }
  };
  const getNextTwoWeeksWindow = () => {
    const now = /* @__PURE__ */ new Date();
    const twoWeeksLater = /* @__PURE__ */ new Date();
    twoWeeksLater.setDate(now.getDate() + 14);
    return {
      start: now.toISOString(),
      end: twoWeeksLater.toISOString()
    };
  };
  const fetchScheduleData = async () => {
    try {
      const weekInfoUrl = "https://libretime.callshopradio.com/api/week-info";
      const weekInfoWienUrl = "https://wien.callshopradio.com/api/week-info";
      const weekInfoWienUrlWithParams = weekInfoWienUrl + "?days=7";
      const timeWindow = getNextTwoWeeksWindow();
      const scheduleUrl = `https://libretime.callshopradio.com/api/shows?start=${timeWindow.start}&end=${timeWindow.end}`;
      const weekInfo = await fetcher(weekInfoUrl).catch(() => {
        return {};
      });
      let weekInfoWien = {};
      try {
        const wienResponse = await fetch(weekInfoWienUrlWithParams);
        if (wienResponse.ok) {
          weekInfoWien = await wienResponse.json();
        }
      } catch (wienError) {
      }
      const schedule = await fetcher(scheduleUrl).catch(() => {
        return [];
      });
      weekInfoData.value = weekInfo || {};
      weekInfoWienData.value = weekInfoWien || {};
      scheduleData.value = schedule || [];
    } catch (err) {
      throw err;
    }
  };
  const processWeekInfo = (weekInfo) => {
    if (!weekInfo || Object.keys(weekInfo).length === 0) {
      return [];
    }
    const filtered = Object.entries(weekInfo).filter(([key]) => key !== "AIRTIME_API_VERSION");
    let allEvents = [];
    filtered.forEach(([dayName, dayContent]) => {
      if (Array.isArray(dayContent)) {
        allEvents = allEvents.concat(dayContent.map((event) => ({
          ...event,
          starts: event.start_timestamp || event.starts,
          ends: event.end_timestamp || event.ends
        })));
      } else if (dayContent && Array.isArray(dayContent[1])) {
        allEvents = allEvents.concat(dayContent[1].map((event) => ({
          ...event,
          starts: event.start_timestamp || event.starts,
          ends: event.end_timestamp || event.ends
        })));
      }
    });
    allEvents = allEvents.map((event) => ({
      ...event,
      isLive: event.description && event.description.trim().toLowerCase().includes("live")
    }));
    return allEvents;
  };
  const processedDusseldorf = computed(() => processWeekInfo(weekInfoData.value));
  const processedWien = computed(() => processWeekInfo(weekInfoWienData.value));
  const getDusseldorfShows = () => {
    return processedDusseldorf.value.sort((a, b) => new Date(a.starts || a.start_timestamp) - new Date(b.starts || b.start_timestamp));
  };
  const getWienShows = () => {
    return processedWien.value.sort((a, b) => new Date(a.starts || a.start_timestamp) - new Date(b.starts || b.start_timestamp));
  };
  return {
    fetchScheduleData,
    getDusseldorfShows,
    getWienShows
  };
}

function useShowFormatters() {
  const getShowStart = (show) => {
    return show.starts || show.start_timestamp || show.start;
  };
  const getShowEnd = (show) => {
    return show.ends || show.end_timestamp || show.end;
  };
  const getShowTitle = (show) => {
    return show.name || show.title || "Unbekannter Titel";
  };
  const getShowDescription = (show) => {
    return show.description || show.instance_description || "";
  };
  const shouldShowInSchedule = (show) => {
    const startTime = new Date(getShowStart(show));
    new Date(getShowEnd(show));
    const startHour = startTime.getHours();
    if (isLiveShow(show)) {
      return true;
    }
    return startHour >= 7 && startHour < 24;
  };
  const isLiveShow = (show) => {
    return show.isLive || false;
  };
  const formatDate = (dateString, includeFullDay = false) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (includeFullDay) {
      const options = {
        weekday: "long",
        // Wochentag ausgeschrieben
        day: "2-digit",
        month: "long",
        year: "numeric"
      };
      return date.toLocaleDateString("de-DE", options);
    } else {
      const options = {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
      };
      return date.toLocaleDateString("de-DE", options);
    }
  };
  const formatTimeRange = (startTime, endTime, includeDate = false) => {
    if (!startTime || !endTime) return "";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const timeOptions = {
      hour: "2-digit",
      minute: "2-digit"
    };
    if (includeDate) {
      return `${start.toLocaleTimeString("de-DE", timeOptions)} - ${end.toLocaleTimeString("de-DE", timeOptions)}`;
    } else {
      return `${start.toLocaleTimeString("de-DE", timeOptions)} - ${end.toLocaleTimeString("de-DE", timeOptions)}`;
    }
  };
  const groupShowsByDay = (shows) => {
    const filteredShows = shows.filter(shouldShowInSchedule);
    if (filteredShows.length === 0) {
      return [];
    }
    const groupedShows = {};
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    filteredShows.forEach((show) => {
      const startDate = new Date(getShowStart(show));
      const showDate = new Date(startDate);
      showDate.setHours(0, 0, 0, 0);
      if (showDate >= today) {
        const dayKey = startDate.toISOString().split("T")[0];
        const isToday = showDate.getTime() === today.getTime();
        if (!groupedShows[dayKey]) {
          groupedShows[dayKey] = {
            date: startDate,
            shows: [],
            isToday
            // Neues Flag für den heutigen Tag
          };
        }
        groupedShows[dayKey].shows.push(show);
      }
    });
    return Object.values(groupedShows).filter((group) => group.shows.length > 0).sort((a, b) => a.date - b.date);
  };
  return {
    getShowStart,
    getShowEnd,
    getShowTitle,
    getShowDescription,
    isLiveShow,
    shouldShowInSchedule,
    formatDate,
    formatTimeRange,
    groupShowsByDay
  };
}

const _sfc_main = {
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a;
    let __temp, __restore;
    const query = groq`${SCHEDULE_QUERY}`;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useCachedSanityQuery(query)), __temp = await __temp, __restore(), __temp);
    const mainStore = useMainStore();
    const loading = ref(true);
    const error = ref(null);
    ref([]);
    const instanceTracks = ref({});
    ref(/* @__PURE__ */ new Date());
    ref(null);
    const { getDusseldorfShows, getWienShows } = useScheduleService();
    const {
      formatDate,
      formatTimeRange,
      getShowStart,
      getShowEnd,
      getShowTitle,
      getShowDescription,
      isLiveShow,
      groupShowsByDay
    } = useShowFormatters();
    const integrateTracks = (shows, trackData) => {
      if (!shows || !trackData) return shows;
      const sortedTracksCache = {};
      for (const instanceId in trackData) {
        if (trackData[instanceId] && Array.isArray(trackData[instanceId])) {
          sortedTracksCache[instanceId] = [...trackData[instanceId]].sort(
            (a, b) => {
              if (a.starts && b.starts) {
                return new Date(a.starts) - new Date(b.starts);
              } else if (a.position !== void 0 && b.position !== void 0) {
                return a.position - b.position;
              } else {
                return 0;
              }
            }
          );
        }
      }
      return shows.map((show) => {
        const instanceId = show.instance_id;
        if (instanceId && sortedTracksCache[instanceId]) {
          return {
            ...show,
            tracks: sortedTracksCache[instanceId]
          };
        }
        return show;
      });
    };
    const dusseldorfShows = computed(() => {
      const shows = getDusseldorfShows();
      return integrateTracks(shows, instanceTracks.value);
    });
    const wienShows = computed(() => getWienShows());
    const groupedDusseldorfShows = computed(
      () => groupShowsByDay(dusseldorfShows.value)
    );
    const groupedWienShows = computed(() => groupShowsByDay(wienShows.value));
    const isLocationVisible = (location) => {
      return mainStore.activeScheduleLocation === location;
    };
    usePageSeo((_a = data == null ? void 0 : data.value) == null ? void 0 : _a.seo);
    useHead({
      bodyAttrs: {
        class: `schedule`
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b;
      const _component_MediaImage = __nuxt_component_2;
      const _component_ModuleScheduleSlider = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "schedule" }, _attrs))} data-v-401da7db><div class="schedule__background" data-v-401da7db>`);
      if ((_a2 = unref(data)) == null ? void 0 : _a2.backgroundImage) {
        _push(ssrRenderComponent(_component_MediaImage, {
          image: (_b = unref(data)) == null ? void 0 : _b.backgroundImage,
          class: "schedule__background__image"
        }, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (loading.value) {
        _push(`<div class="schedule__loading" data-v-401da7db></div>`);
      } else if (error.value) {
        _push(`<div class="schedule__error" data-v-401da7db><div class="error-message" data-v-401da7db>${ssrInterpolate(error.value)}</div><button class="refresh-button" data-v-401da7db>Reload</button></div>`);
      } else {
        _push(`<div class="schedule__content" data-v-401da7db>`);
        if (isLocationVisible("channelOne")) {
          _push(ssrRenderComponent(_component_ModuleScheduleSlider, {
            groups: groupedDusseldorfShows.value,
            formatDate: unref(formatDate),
            getShowTitle: unref(getShowTitle),
            getShowDescription: unref(getShowDescription),
            getShowStart: unref(getShowStart),
            getShowEnd: unref(getShowEnd),
            formatTimeRange: unref(formatTimeRange),
            isLiveShow: unref(isLiveShow)
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        if (isLocationVisible("channelTwo")) {
          _push(ssrRenderComponent(_component_ModuleScheduleSlider, {
            groups: groupedWienShows.value,
            formatDate: unref(formatDate),
            getShowTitle: unref(getShowTitle),
            getShowDescription: unref(getShowDescription),
            getShowStart: unref(getShowStart),
            getShowEnd: unref(getShowEnd),
            formatTimeRange: unref(formatTimeRange),
            isLiveShow: unref(isLiveShow)
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/schedule/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-401da7db"]]);

export { index as default };
