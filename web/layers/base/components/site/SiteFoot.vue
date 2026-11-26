<script setup>
import { useMainStore } from "~/stores/mainStore";

const { locale } = useI18n();
const localePath = useLocalePath();
const mainStore = useMainStore();
const config = useRuntimeConfig();
const { open: chatOpen } = useChatUi();
const { openPopup: openTimetablePopup, expand: expandTimetable } =
	useTimetableUi();

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
		address: "Erkrather Straße 6, 40233 Düsseldorf",
		email: "duesseldorf@callshopradio.com",
		mapQuery: "Erkrather Straße 6, 40233 Düsseldorf",
	},
	{
		code: "LPZ",
		city: { en: "Leipzig", de: "Leipzig" },
		address: "Crottendorferstraße 10, 04317 Leipzig",
		email: "leipzig@callshopradio.com",
		mapQuery: "Crottendorferstraße 10, 04317 Leipzig",
	},
	{
		code: "VIE",
		city: { en: "Vienna", de: "Wien" },
		address: "Praterstern 5, 1020 Wien",
		email: "vienna@callshopradio.com",
		mapQuery: "Praterstern 5, 1020 Wien",
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
		pages: de ? "Seiten" : "Pages",
		apply: de ? "Bewerben" : "Apply for",
		follow: de ? "Folgen" : "Follow",
		shows: "Shows",
		pool: "Pool",
		words: "Words",
		schedule: de ? "Programm" : "Schedule",
		search: de ? "Suche" : "Search",
		merch: "Merch",
		chat: "Chat",
		legal: de ? "Impressum" : "Legal Notice",
		legalPrivacy: de ? "Impressum & Datenschutz" : "Legal & Privacy",
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
		theme: de ? "Hell / Dunkel" : "Light / Dark",
		residency: "Residency",
		poolProfile: de ? "Pool-Profil" : "Pool-Profile",
		guestSlots: de ? "Guest-Slots" : "Guest slots",
		guestDusCity: "Düsseldorf",
		guestLpzCity: "Leipzig",
		guestVieCity: de ? "Wien" : "Vienna",
		wordsMail: "words@callshopradio.com",
	};
});

const applyLinks = computed(() => [
	{
		label: copy.value.residency,
		href: "https://tally.so/r/gDRaB1",
		external: true,
		icon: "residency",
	},
	{
		label: copy.value.poolProfile,
		href: localePath("/konto"),
		external: false,
		icon: "pool",
	},
	{
		label: copy.value.words,
		href: `mailto:${copy.value.wordsMail}`,
		external: false,
		mail: true,
		icon: "words",
	},
]);

const guestSlots = computed(() => [
	{
		code: "DUS",
		city: copy.value.guestDusCity,
		href: "https://tally.so/r/31ap5O",
	},
	{
		code: "LPZ",
		city: copy.value.guestLpzCity,
		href: "https://tally.so/r/wAk9Dy",
	},
	{
		code: "VIE",
		city: copy.value.guestVieCity,
		href: "https://tally.so/r/nPor45",
	},
]);

function mapsUrl(query) {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function stationCity(station) {
	return station.city[locale.value] || station.city.en;
}

function openChat() {
	chatOpen.value = true;
}

function openTimetable() {
	openTimetablePopup("day");
	// From the footer the full schedule is the point, not the compact panel.
	expandTimetable();
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
							<span class="station__address">
								{{ station.address }}
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

					<div class="site-footer__apply">
						<h3 class="site-footer__label">{{ copy.apply }}</h3>

						<div class="apply-chips">
							<template v-for="link in applyLinks" :key="link.label">
								<a
									v-if="link.external"
									class="apply-chip"
									:href="link.href"
									target="_blank"
									rel="noopener noreferrer"
								>
									<SiteApplyIcon :name="link.icon" />
									<span>{{ link.label }}</span>
								</a>
								<NuxtLink
									v-else-if="!link.mail"
									class="apply-chip"
									:to="link.href"
								>
									<SiteApplyIcon :name="link.icon" />
									<span>{{ link.label }}</span>
								</NuxtLink>
								<a v-else class="apply-chip" :href="link.href">
									<SiteApplyIcon :name="link.icon" />
									<span>{{ link.label }}</span>
								</a>
							</template>
						</div>

						<div class="apply-guests">
							<span class="apply-guests__label">
								<SiteApplyIcon name="guest" />
								{{ copy.guestSlots }}
							</span>
							<a
								v-for="slot in guestSlots"
								:key="slot.code"
								class="apply-city"
								:href="slot.href"
								target="_blank"
								rel="noopener noreferrer"
								:aria-label="`Guest-Slot ${slot.city}`"
								:title="`Guest-Slot ${slot.city}`"
							>
								{{ slot.code }}
							</a>
						</div>
					</div>
				</div>
			</div>

			<div class="site-footer__nav">
				<nav class="footer-column" aria-labelledby="footer-explore">
					<h3 id="footer-explore" class="site-footer__label">
						{{ copy.explore }}
					</h3>
					<ul>
						<li>
							<NuxtLink :to="localePath('/shows')" class="footer-link--shows">
								<SitePageIcon name="shows" />
								{{ copy.shows }}
							</NuxtLink>
						</li>
						<li>
							<NuxtLink :to="localePath('/pool')" class="footer-link--pool">
								<SitePageIcon name="pool" />
								{{ copy.pool }}
							</NuxtLink>
						</li>
						<li>
							<NuxtLink :to="localePath('/words')" class="footer-link--words">
								<SitePageIcon name="words" />
								{{ copy.words }}
							</NuxtLink>
						</li>
						<li>
							<NuxtLink :to="localePath('/index')" class="footer-link--index">
								<SitePageIcon name="index" />
								{{ copy.index }}
							</NuxtLink>
						</li>
						<li>
							<NuxtLink :to="localePath('/merch')" class="footer-link--merch">
								<SitePageIcon name="shop" />
								{{ copy.merch }}
							</NuxtLink>
						</li>
					</ul>
				</nav>

				<nav class="footer-column" aria-labelledby="footer-pages">
					<h3 id="footer-pages" class="site-footer__label">
						{{ copy.pages }}
					</h3>
					<ul>
						<li>
							<NuxtLink :to="localePath('/konto')">
								<SitePageIcon name="account" />
								{{ copy.account }}
							</NuxtLink>
						</li>
						<li v-if="chatEnabled">
							<button
								type="button"
								class="site-footer__link-button"
								@click="openChat"
							>
								<SitePageIcon name="chat" />
								{{ copy.chat }}
							</button>
						</li>
						<li>
							<button
								type="button"
								class="site-footer__link-button"
								aria-haspopup="dialog"
								@click="openTimetable"
							>
								<SitePageIcon name="calendar" />
								{{ copy.schedule }}
							</button>
						</li>
						<li>
							<NuxtLink :to="localePath('/legal')">
								<SitePageIcon name="legal" />
								{{ copy.legalPrivacy }}
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
								<SiteSocialIcon name="instagram" />
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
								<SiteSocialIcon name="soundcloud" />
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
								<SiteSocialIcon name="bandcamp" />
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
								<SiteSocialIcon name="discord" />
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
				<div class="site-footer__theme">
					<span class="site-footer__label">{{ copy.theme }}</span>
					<SiteDarkMode />
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

  padding: 0 var(--page-gutter) var(--filter-dock-global, 0px);
  border-top: 1px solid var(--color-text);
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-text);
  font-size: var(--text-md);
  line-height: 1.25;
}

.site-footer__inner {
  width: 100%;
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: clamp(3.5rem, 7vw, 6rem) 0 1.5rem;
}

.site-footer__top {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(32rem, 1.1fr);
  gap: clamp(2rem, 4vw, 4rem);
  padding-bottom: clamp(2.5rem, 5vw, 4rem);
  border-bottom: 1px solid var(--color-line);
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
  color: var(--color-text);
  font-size: var(--text-xl);
  line-height: 1.5;
}

.site-footer__mail {
  display: inline-block;
  margin-top: 1.35rem;
  padding-bottom: 0.2rem;
  border-bottom: 1px solid var(--color-pink);
  color: var(--color-pink);
  font-family: var(--font-text-medium);
  font-size: var(--text-md);
  text-decoration: none;
}

.site-footer__mail:hover {
  color: var(--color-text);
}

.site-footer__address {
  margin: 1.1rem 0 0;
  color: var(--color-text);
  font-size: var(--text-md);
  line-height: 1.6;
}

.site-footer__address span {
  display: inline-block;
  margin-bottom: 0.2rem;
  color: var(--color-text);
  font-size: var(--text-sm);
  letter-spacing: var(--menu-letter-spacing);
  text-transform: uppercase;
}

.site-footer__label {
  margin: 0 0 1.1rem;
  color: var(--color-text);
  font-family: var(--font-text-medium);
  font-size: var(--text-sm);
  letter-spacing: var(--menu-letter-spacing);
  line-height: 1;
  text-transform: uppercase;
}

.station-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.site-footer__stations {
  max-width: 40rem;
}

.station {
  display: grid;
  grid-template-columns:
    2.8rem 6rem max-content minmax(0, 1fr)
    auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 0;
  border-top: 1px solid var(--color-line);
}

.station:first-child {
  padding-top: 0;
  border-top: 0;
}

.station__code {
  color: var(--color-pink);
  font-size: var(--text-sm);
  letter-spacing: var(--menu-letter-spacing);
}

.station__city {
  color: var(--color-text);
  font-family: var(--font-text-semibold);
  font-size: var(--text-md);
  white-space: nowrap;
}

.station__address {
  min-width: 0;
  color: var(--color-dark-grey);
  font-size: var(--text-sm);
  line-height: 1.35;
}

.station__map {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.65rem;
  height: 1.65rem;
  border: 1px solid color-mix(in srgb, var(--color-text) 22%, transparent);
  border-radius: 50%;
  color: var(--color-text);
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
  color: var(--color-text);
  font-size: var(--text-md);
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.station__mail:hover {
  color: var(--color-pink);
}

.site-footer__apply {
  margin-top: 2.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--color-line);
}

.apply-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.apply-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.32rem 0.7rem;
  border: 1px solid color-mix(in srgb, var(--color-text) 22%, transparent);
  border-radius: var(--radius-pill);
  color: var(--color-text);
  font-family: var(--font-text-medium);
  font-size: var(--text-sm);
  line-height: 1.2;
  text-decoration: none;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);

  &:hover {
    border-color: var(--color-pink);
    color: var(--color-pink);
  }

  &:focus-visible {
    outline: 2px solid var(--color-pink);
    outline-offset: 2px;
  }
}

.apply-guests {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.55rem;
}

.apply-guests__label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-right: 0.2rem;
  color: var(--color-dark-grey);
  font-size: var(--text-sm);
  letter-spacing: var(--button-letter-spacing);
  text-transform: uppercase;
}

.apply-city {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.6rem;
  padding: 0.28rem 0.5rem;
  border: 1px solid color-mix(in srgb, var(--color-text) 22%, transparent);
  border-radius: var(--radius-pill);
  color: var(--color-text);
  font-family: var(--font-text-medium);
  font-size: var(--text-sm);
  letter-spacing: var(--button-letter-spacing);
  line-height: 1.2;
  text-decoration: none;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast),
    background-color var(--transition-fast);

  &:hover {
    border-color: var(--color-text);
    background-color: var(--color-text);
    color: var(--color-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }
}

.site-footer__bottom {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.1rem 0 0;
  border-top: 1px solid var(--color-line);
}

.site-footer__theme {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  .site-footer__label {
    margin: 0;
  }
}

.site-footer__nav {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  column-gap: clamp(2rem, 5vw, 5rem);
  row-gap: var(--base-padding);
  padding: var(--base-margin) 0;
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
  color: var(--color-text);
  font-size: var(--text-md);
  line-height: 1.4;
  text-decoration: none;
}

.footer-column a:hover {
  color: var(--color-pink);
}

.footer-column a.footer-link--shows:hover {
  color: var(--color-pink);
}

.footer-column a.footer-link--pool:hover {
  color: var(--color-blue);
}

.footer-column a.footer-link--words:hover {
  color: var(--color-green);
}

.footer-column a.footer-link--index:hover {
  color: var(--color-purple);
}

.footer-column a.footer-link--merch:hover {
  color: var(--color-merch);
}

.footer-column .site-footer__link-button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-text);
  font: inherit;
  font-size: var(--text-md);
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

.site-footer__top-link {
  display: inline-flex;
  grid-column: 1 / -1;
  justify-self: end;
  align-items: center;
  gap: 0.4rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-text);
  font: inherit;
  font-size: var(--text-sm);
  letter-spacing: var(--menu-letter-spacing);
  text-transform: uppercase;
  cursor: pointer;
}

.site-footer__top-link:hover {
  color: var(--color-pink);
}

.site-footer a:focus-visible,
.site-footer button:focus-visible {
  border-radius: var(--radius-xs);
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

  .site-footer__top {
    grid-template-columns: minmax(0, 1fr);
    gap: 2.5rem;
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

  .site-footer__nav {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2.5rem;
  }
}

@media (max-width: 700px) {
  .station {
    grid-template-columns: 2.2rem auto minmax(0, 1fr) auto;
    grid-template-areas:
      "code city email map"
      ". address address address";
    gap: 0.35rem 0.55rem;
  }

  .station__code {
    grid-area: code;
  }

  .station__city {
    grid-area: city;
  }

  .station__address {
    grid-area: address;
  }

  .station__mail {
    grid-area: email;
  }

  .station__map {
    grid-area: map;
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

  .station__map {
    width: 1.5rem;
    height: 1.5rem;
  }

  .site-footer__nav {
    grid-template-columns: minmax(0, 1fr);
    gap: 2rem;
    padding: 2.25rem 0 2.5rem;
  }
}

</style>
