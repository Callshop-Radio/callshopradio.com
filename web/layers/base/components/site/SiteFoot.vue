<script setup>
import { useMainStore } from "~/stores/mainStore";

const { locale } = useI18n();
const localePath = useLocalePath();
const mainStore = useMainStore();
const config = useRuntimeConfig();
const { open: chatOpen } = useChatUi();

const year = new Date().getFullYear();
const chatEnabled = computed(
	() => import.meta.dev || Boolean(config.public.chatEnabled),
);
const discordUrl = computed(
	() => mainStore?.siteNav?.discordLink || "https://discord.gg/ZNpKHSgQkR",
);

// Contact details mirror the Sanity contact and legal-notice pages.
const stations = [
	{
		code: "DUS",
		city: { en: "Düsseldorf", de: "Düsseldorf" },
		email: "duesseldorf@callshopradio.com",
		mapQuery: "Callshop Radio Düsseldorf",
	},
	{
		code: "LPZ",
		city: { en: "Leipzig", de: "Leipzig" },
		email: "leipzig@callshopradio.com",
		mapQuery: "Crottendorferstraße 10, 04317 Leipzig",
	},
	{
		code: "VIE",
		city: { en: "Vienna", de: "Wien" },
		email: "vienna@callshopradio.com",
		mapQuery: "Callshop Radio Vienna",
	},
];

const copy = computed(() => {
	const de = locale.value === "de";
	return {
		tagline: de
			? "Unabhängiges Community-Radio, live aus Düsseldorf, Leipzig und Wien."
			: "Independent community radio, live from Düsseldorf, Leipzig and Vienna.",
		stations: de ? "Standorte" : "Stations",
		maps: de ? "In Maps öffnen" : "Open in Maps",
		explore: de ? "Entdecken" : "Explore",
		information: de ? "Informationen" : "Information",
		follow: de ? "Folgen" : "Follow",
		shows: "Shows",
		pool: "Pool",
		words: "Words",
		schedule: de ? "Programm" : "Schedule",
		search: de ? "Suche" : "Search",
		shop: "Shop",
		chat: "Chat",
		contact: de ? "Kontakt" : "Contact",
		legal: de ? "Impressum" : "Legal Notice",
		privacy: de ? "Datenschutz" : "Privacy",
		account: de ? "Konto" : "Account",
		index: "Index",
		instagram: "Instagram",
		soundcloud: "SoundCloud",
		bandcamp: "Bandcamp",
		discord: "Discord",
		registered: de ? "Vereinssitz" : "Registered office",
		country: de ? "Deutschland" : "Germany",
		backToTop: de ? "Nach oben" : "Back to top",
		rights: de
			? "Unabhängiges Community-Radio seit 2017."
			: "Independent community radio since 2017.",
	};
});

function mapsUrl(query) {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function stationCity(station) {
	return station.city[locale.value] || station.city.en;
}

function openChat() {
	chatOpen.value = true;
}

function scrollToTop() {
	if (typeof window === "undefined") return;
	const reduceMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;
	window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}
</script>

<template>
	<footer class="site-footer">
		<h2 class="sr-only">Callshop Radio</h2>

		<div class="site-footer__inner">
			<div class="site-footer__top">
				<div class="site-footer__brand">
					<NuxtLink
						:to="localePath('/')"
						class="site-footer__logo"
						aria-label="Callshop Radio"
					>
						<ElementsCallshopLogo class="site-footer__mark" />
						<ElementsCallshopTextLogo class="site-footer__wordmark" />
					</NuxtLink>

					<p class="site-footer__tagline">{{ copy.tagline }}</p>

					<a
						class="site-footer__mail"
						href="mailto:info@callshopradio.com"
					>
						info@callshopradio.com
					</a>

					<p class="site-footer__address">
						<span>{{ copy.registered }}</span><br />
						Callshop Radio e.V.<br />
						Crottendorferstraße 10<br />
						04317 Leipzig, {{ copy.country }}
					</p>
				</div>

				<div class="site-footer__stations">
					<h3 class="site-footer__label">{{ copy.stations }}</h3>
					<ul class="station-list">
						<li
							v-for="station in stations"
							:key="station.email"
							class="station"
						>
							<span class="station__code">{{ station.code }}</span>
							<span class="station__city">
								{{ stationCity(station) }}
							</span>
							<a
								class="station__mail"
								:href="`mailto:${station.email}`"
							>
								{{ station.email }}
							</a>
							<a
								class="station__map"
								:href="mapsUrl(station.mapQuery)"
								target="_blank"
								rel="noopener noreferrer"
								:aria-label="`${stationCity(station)} – ${copy.maps}`"
								:title="copy.maps"
							>
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"
										stroke="currentColor"
										stroke-width="1.8"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
									<circle
										cx="12"
										cy="10"
										r="2.6"
										stroke="currentColor"
										stroke-width="1.8"
									/>
								</svg>
							</a>
						</li>
					</ul>
				</div>
			</div>

			<div class="site-footer__nav">
				<nav class="footer-column" aria-labelledby="footer-explore">
					<h3 id="footer-explore" class="site-footer__label">
						{{ copy.explore }}
					</h3>
					<ul>
						<li>
							<NuxtLink :to="localePath('/shows')">
								{{ copy.shows }}
							</NuxtLink>
						</li>
						<li>
							<NuxtLink :to="localePath('/pool')">
								{{ copy.pool }}
							</NuxtLink>
						</li>
						<li>
							<NuxtLink :to="localePath('/words')">
								{{ copy.words }}
							</NuxtLink>
						</li>
						<li>
							<a
								href="https://index.callshopradio.com/"
								target="_blank"
								rel="noopener noreferrer"
							>
								{{ copy.index }}
								<svg
									class="site-footer__external-icon"
									width="10"
									height="10"
									viewBox="0 0 10 10"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M2 8L8 2M3.2 2H8V6.8"
										stroke="currentColor"
										stroke-width="1.1"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</a>
						</li>
						<li>
							<NuxtLink :to="localePath('/schedule')">
								{{ copy.schedule }}
							</NuxtLink>
						</li>
						<li>
							<NuxtLink :to="localePath('/search')">
								{{ copy.search }}
							</NuxtLink>
						</li>
						<li>
							<NuxtLink :to="localePath('/shop')">
								{{ copy.shop }}
							</NuxtLink>
						</li>
						<li v-if="chatEnabled">
							<button
								type="button"
								class="site-footer__link-button"
								@click="openChat"
							>
								{{ copy.chat }}
							</button>
						</li>
					</ul>
				</nav>

				<nav class="footer-column" aria-labelledby="footer-info">
					<h3 id="footer-info" class="site-footer__label">
						{{ copy.information }}
					</h3>
					<ul>
						<li>
							<NuxtLink :to="localePath('/contact')">
								{{ copy.contact }}
							</NuxtLink>
						</li>
						<li>
							<NuxtLink :to="localePath('/legal-notice')">
								{{ copy.legal }}
							</NuxtLink>
						</li>
						<li>
							<NuxtLink :to="localePath('/privacy')">
								{{ copy.privacy }}
							</NuxtLink>
						</li>
						<li>
							<NuxtLink :to="localePath('/konto')">
								{{ copy.account }}
							</NuxtLink>
						</li>
					</ul>
				</nav>

				<nav class="footer-column" aria-labelledby="footer-follow">
					<h3 id="footer-follow" class="site-footer__label">
						{{ copy.follow }}
					</h3>
					<ul>
						<li>
							<a
								href="https://www.instagram.com/callshopradio/"
								target="_blank"
								rel="noopener noreferrer"
							>
								{{ copy.instagram }}
								<svg
									class="site-footer__external-icon"
									width="10"
									height="10"
									viewBox="0 0 10 10"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M2 8L8 2M3.2 2H8V6.8"
										stroke="currentColor"
										stroke-width="1.1"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</a>
						</li>
						<li>
							<a
								href="https://soundcloud.com/callshopradio"
								target="_blank"
								rel="noopener noreferrer"
							>
								{{ copy.soundcloud }}
								<svg
									class="site-footer__external-icon"
									width="10"
									height="10"
									viewBox="0 0 10 10"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M2 8L8 2M3.2 2H8V6.8"
										stroke="currentColor"
										stroke-width="1.1"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</a>
						</li>
						<li>
							<a
								href="https://callshopradio.bandcamp.com/"
								target="_blank"
								rel="noopener noreferrer"
							>
								{{ copy.bandcamp }}
								<svg
									class="site-footer__external-icon"
									width="10"
									height="10"
									viewBox="0 0 10 10"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M2 8L8 2M3.2 2H8V6.8"
										stroke="currentColor"
										stroke-width="1.1"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</a>
						</li>
						<li>
							<a
								:href="discordUrl"
								target="_blank"
								rel="noopener noreferrer"
							>
								{{ copy.discord }}
								<svg
									class="site-footer__external-icon"
									width="10"
									height="10"
									viewBox="0 0 10 10"
									fill="none"
									aria-hidden="true"
								>
									<path
										d="M2 8L8 2M3.2 2H8V6.8"
										stroke="currentColor"
										stroke-width="1.1"
										stroke-linecap="round"
										stroke-linejoin="round"
									/>
								</svg>
							</a>
						</li>
					</ul>
				</nav>
			</div>

			<div class="site-footer__bottom">
				<div class="site-footer__meta">
					<span>© {{ year }} Callshop Radio e.V.</span>
					<span>{{ copy.rights }}</span>
				</div>
				<button
					type="button"
					class="site-footer__top-link"
					@click="scrollToTop"
				>
					{{ copy.backToTop }}
					<svg
						width="10"
						height="12"
						viewBox="0 0 10 12"
						fill="none"
						aria-hidden="true"
					>
						<path
							d="M5 11V1M1 5L5 1L9 5"
							stroke="currentColor"
							stroke-width="1.1"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			</div>
		</div>
	</footer>
</template>

<style lang="postcss" scoped>
.site-footer {
  /* Only the rule colour is footer-specific; every text and surface colour
     comes from the global palette so the footer follows the site theme. */
  --footer-line: color-mix(in srgb, var(--color-text) 16%, transparent);

  padding: 0 var(--page-gutter) var(--filter-dock-global, 0px);
  border-top: 1px solid var(--color-text);
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-text);
  font-size: var(--base-font-size);
  line-height: var(--base-line-height);
}

.site-footer__inner {
  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: clamp(3.5rem, 7vw, 6rem) 0 1.5rem;
}

.site-footer__top {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(18rem, 0.75fr);
  gap: clamp(3rem, 7vw, 7rem);
  padding-bottom: clamp(2.5rem, 5vw, 4rem);
  border-bottom: 1px solid var(--footer-line);
}

.site-footer__logo {
  display: inline-flex;
  align-items: center;
  gap: 0.9rem;
  width: max-content;
  max-width: 100%;
  color: inherit;
  text-decoration: none;
}

.site-footer__mark {
  display: block;
  flex: none;
  width: 2.15rem;
  height: auto;
  filter: invert(var(--logo-invert));
}

.site-footer__wordmark {
  display: block;
  width: 15rem;
  height: auto;
  filter: invert(var(--logo-invert));
}

@media (max-width: 1100px) {
  .site-footer__wordmark {
    display: none;
  }

  .site-footer__logo::after {
    content: "CALLSHOP RADIO";
    color: var(--color-text);
    font-family: var(--font-text-semibold);
    font-size: clamp(1.5rem, 4vw, 2rem);
    letter-spacing: -0.04em;
    line-height: 1;
    white-space: nowrap;
  }
}

.site-footer__tagline {
  margin: 1.5rem 0 0;
  color: var(--color-dark-grey);
  font-size: var(--large-font-size);
  line-height: 1.5;
}

.site-footer__mail {
  display: inline-block;
  margin-top: 1.35rem;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid var(--color-pink);
  color: var(--color-pink);
  font-family: var(--font-text-medium);
  font-size: var(--base-font-size);
  text-decoration: none;
}

.site-footer__mail:hover {
  color: var(--color-text);
}

.site-footer__address {
  margin: 1.1rem 0 0;
  color: var(--color-dark-grey);
  font-size: var(--base-font-size);
  line-height: 1.6;
}

.site-footer__address span {
  display: inline-block;
  margin-bottom: 0.2rem;
  color: var(--color-dark-grey);
  font-size: var(--small-font-size);
  letter-spacing: var(--menu-letter-spacing);
  text-transform: uppercase;
}

.site-footer__label {
  margin: 0 0 1.1rem;
  color: var(--color-dark-grey);
  font-family: var(--font-text-medium);
  font-size: var(--small-font-size);
  letter-spacing: var(--menu-letter-spacing);
  line-height: 1;
  text-transform: uppercase;
}

.station-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.station {
  display: grid;
  grid-template-columns: 2.8rem 6rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.85rem;
  padding: 0.8rem 0;
  border-top: 1px solid var(--footer-line);
}

.station:first-child {
  padding-top: 0;
  border-top: 0;
}

.station__code {
  color: var(--color-pink);
  font-size: var(--small-font-size);
  letter-spacing: var(--menu-letter-spacing);
}

.station__city {
  color: var(--color-text);
  font-family: var(--font-text-semibold);
  font-size: var(--base-font-size);
  white-space: nowrap;
}

.station__map {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.65rem;
  height: 1.65rem;
  border: 1px solid color-mix(in srgb, var(--color-text) 22%, transparent);
  border-radius: 50%;
  color: var(--color-dark-grey);
  text-decoration: none;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.station__map:hover {
  border-color: var(--color-pink);
  color: var(--color-pink);
}

.station__mail {
  min-width: 0;
  overflow: hidden;
  color: var(--color-dark-grey);
  font-size: var(--base-font-size);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.station__mail:hover {
  color: var(--color-text);
}

.site-footer__nav {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(2rem, 5vw, 5rem);
  padding: var(--base-margin) 0 var(--big-margin);
}

.footer-column ul {
  display: grid;
  gap: var(--base-padding);
  margin: 0;
  padding: 0;
  list-style: none;
}

.footer-column a {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-dark-grey);
  font-size: var(--base-font-size);
  line-height: 1.4;
  text-decoration: none;
}

.footer-column a:hover {
  color: var(--color-pink);
}

.footer-column .site-footer__link-button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-dark-grey);
  font: inherit;
  font-size: var(--base-font-size);
  line-height: 1.4;
  text-decoration: none;
  cursor: pointer;
}

.footer-column .site-footer__link-button:hover {
  color: var(--color-pink);
}

.site-footer__external-icon {
  flex: none;
  width: 0.6rem;
  height: 0.6rem;
  opacity: 0.5;
}

.site-footer__bottom {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--footer-line);
}

.site-footer__meta {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: var(--color-dark-grey);
  font-size: var(--small-font-size);
  letter-spacing: var(--button-letter-spacing);
  line-height: 1.5;
  text-transform: uppercase;
}

.site-footer__top-link {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-dark-grey);
  font: inherit;
  font-size: var(--small-font-size);
  letter-spacing: var(--menu-letter-spacing);
  text-transform: uppercase;
  cursor: pointer;
}

.site-footer__top-link:hover {
  color: var(--color-pink);
}

.site-footer a:focus-visible,
.site-footer button:focus-visible {
  border-radius: 0.15rem;
  outline: 2px solid var(--color-pink);
  outline-offset: 0.25rem;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 1100px) {
  .site-footer {
    padding-bottom: 56px;
  }
}

@media (max-width: 1000px) {
  .site-footer__top {
    gap: 3rem;
  }

  .site-footer__nav {
    gap: 2.5rem;
  }
}

@media (max-width: 900px) {
  .site-footer {
    padding-right: 1.5rem;
    padding-left: 1.5rem;
  }

  .site-footer__inner {
    padding-top: 3rem;
  }

  .site-footer__top {
    grid-template-columns: minmax(0, 1fr);
    gap: 3rem;
  }

  .site-footer__stations {
    max-width: 32rem;
  }

  .site-footer__nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2.5rem;
  }
}

@media (max-width: 600px) {
  .site-footer {
    padding-right: 1.1rem;
    padding-left: 1.1rem;
    padding-bottom: 56px;
  }

  .site-footer__inner {
    padding-top: 2.5rem;
    padding-bottom: 1.25rem;
  }

  .site-footer__mark {
    width: 1.8rem;
  }

  .station {
    grid-template-columns: 2.2rem auto minmax(0, 1fr) auto;
    gap: 0.55rem;
  }

  .station__map {
    width: 1.5rem;
    height: 1.5rem;
  }

  .site-footer__nav {
    grid-template-columns: minmax(0, 1fr);
    gap: 2rem;
    padding: 2.25rem 0 2.5rem;
  }

  .site-footer__bottom {
    align-items: flex-start;
    flex-direction: column;
    gap: 1.25rem;
  }
}

</style>
