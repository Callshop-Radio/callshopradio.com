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
		hq: false,
	},
	{
		code: "LEJ",
		city: { en: "Leipzig", de: "Leipzig" },
		email: "leipzig@callshopradio.com",
		mapQuery: "Crottendorferstraße 10, 04317 Leipzig",
		hq: true,
	},
	{
		code: "VIE",
		city: { en: "Vienna", de: "Wien" },
		email: "vienna@callshopradio.com",
		mapQuery: "Callshop Radio Vienna",
		hq: false,
	},
];

const copy = computed(() => {
	const de = locale.value === "de";
	return {
		tagline: de
			? "Unabhängiges Community-Radio, live aus Düsseldorf, Leipzig und Wien."
			: "Independent community radio, live from Düsseldorf, Leipzig and Vienna.",
		stations: de ? "Standorte" : "Stations",
		hq: de ? "Sitz" : "HQ",
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
							:key="station.code"
							class="station"
						>
							<span class="station__code">{{ station.code }}</span>
							<span class="station__city">
								{{ stationCity(station) }}
								<span v-if="station.hq" class="station__hq">
									{{ copy.hq }}
								</span>
							</span>
							<a
								class="station__map"
								:href="mapsUrl(station.mapQuery)"
								target="_blank"
								rel="noopener noreferrer"
								:aria-label="`${stationCity(station)} – ${copy.maps}`"
							>
								<span>{{ copy.maps }}</span>
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
							<a
								class="station__mail"
								:href="`mailto:${station.email}`"
							>
								{{ station.email }}
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
  --footer-bg: var(--color-black);
  --footer-fg: #f6f6f8;
  --footer-muted: rgba(246, 246, 248, 0.62);
  --footer-faint: rgba(246, 246, 248, 0.4);
  --footer-line: rgba(246, 246, 248, 0.15);

  padding: 0 var(--page-gutter) var(--filter-dock-global, 0px);
  border-top: 1px solid rgba(247, 148, 179, 0.55);
  background: var(--footer-bg);
  color: var(--footer-fg);
  font-family: var(--font-text);
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
  filter: invert(1);
}

.site-footer__wordmark {
  display: block;
  width: 15rem;
  height: auto;
  filter: invert(1);
}

@media (max-width: 1100px) {
  .site-footer__wordmark {
    display: none;
  }

  .site-footer__logo::after {
    content: "CALLSHOP RADIO";
    color: var(--footer-fg);
    font-size: clamp(1.5rem, 4vw, 2rem);
    font-weight: 600;
    letter-spacing: -0.04em;
    line-height: 1;
    white-space: nowrap;
  }
}

.site-footer__tagline {
  max-width: 33rem;
  margin: 1.5rem 0 0;
  color: var(--footer-muted);
  font-size: 1.05rem;
  line-height: 1.55;
}

.site-footer__mail {
  display: inline-block;
  margin-top: 1.35rem;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid var(--color-pink);
  color: var(--footer-fg);
  font-size: 1.05rem;
  text-decoration: none;
}

.site-footer__mail:hover {
  color: var(--color-pink);
}

.site-footer__address {
  margin: 1.1rem 0 0;
  color: var(--footer-faint);
  font-size: 0.72rem;
  line-height: 1.7;
}

.site-footer__address span {
  display: inline-block;
  margin-bottom: 0.2rem;
  color: var(--footer-muted);
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.site-footer__label {
  margin: 0 0 1.1rem;
  color: var(--footer-muted);
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.14em;
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
  grid-template-columns: 3.1rem minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 0.3rem 1rem;
  padding: 0.9rem 0;
  border-top: 1px solid var(--footer-line);
}

.station:first-child {
  padding-top: 0;
  border-top: 0;
}

.station__code {
  color: var(--color-pink);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
}

.station__city {
  color: var(--footer-fg);
  font-size: 1rem;
  font-weight: 600;
}

.station__hq {
  margin-left: 0.5rem;
  color: var(--color-pink);
  font-size: 0.58rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.station__map {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  color: var(--footer-muted);
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
  white-space: nowrap;
}

.station__map:hover {
  color: var(--color-pink);
}

.station__mail {
  grid-column: 2 / -1;
  overflow-wrap: anywhere;
  color: var(--footer-muted);
  font-size: 0.78rem;
  text-decoration: none;
}

.station__mail:hover {
  color: var(--footer-fg);
}

.site-footer__nav {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(2rem, 5vw, 5rem);
  padding: 2.75rem 0 3.25rem;
}

.footer-column ul {
  display: grid;
  gap: 0.7rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.footer-column a {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: rgba(246, 246, 248, 0.72);
  font-size: 0.88rem;
  line-height: 1.3;
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
  color: rgba(246, 246, 248, 0.72);
  font: inherit;
  font-size: 0.88rem;
  line-height: 1.3;
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
  color: var(--footer-faint);
  font-size: 0.62rem;
  letter-spacing: 0.07em;
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
  color: var(--footer-muted);
  font: inherit;
  font-size: 0.62rem;
  letter-spacing: 0.1em;
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

  .site-footer__tagline {
    font-size: 1rem;
  }

  .station {
    grid-template-columns: 2.6rem minmax(0, 1fr) auto;
    gap: 0.25rem 0.6rem;
  }

  .station__mail {
    font-size: 0.74rem;
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
