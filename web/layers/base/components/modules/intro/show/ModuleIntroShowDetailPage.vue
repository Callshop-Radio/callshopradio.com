<script setup lang="ts">
import { computed } from "vue";
import { useMainStore } from "~/stores/mainStore";
import type { Image } from "~/types/sanity";

const { locale: _locale, setLocale: _setLocale } = useI18n();
const { getItemRoute } = useContentRoute();

// Typdefinitionen
interface Tag {
	_id?: string;
	_type?: string;
	title?: string | unknown;
	short?: string;
}

interface ShowItem {
	_id?: string;
	_type?: string;
	title?: string;
	name?: string;
	content?: object;
	slug?: { current?: string };
	image?: Image;
	mainImage?: Image;
	location?: string;
	tags?: Tag[];
	bio?: unknown[];
}

// Props
const props = defineProps<{
	showItem: ShowItem;
}>();

// Store
const mainStore = useMainStore();

// Composable für Bild-Management
const useImageManagement = () => {
	// Helper-Funktion für Bild-Fetching und Fallbacks
	function getItemImage(item?: PoolItem): Image | null {
		if (!item) return null;

		// Bild aus dem Item selbst
		if (item.image || item.mainImage) {
			return item.image || item.mainImage;
		}

		// Fallbacks je nach Content-Typ
		if (item._type === "person") {
			return mainStore?.siteFallbacks?.fallbackPerson?.image;
		} else if (item._type === "venue") {
			return mainStore?.siteFallbacks?.fallbackVenue?.image;
		}

		// Allgemeines Fallback
		return mainStore?.siteFallbacks?.fallbackPerson?.image;
	}

	// Computed Property für das Bild
	const itemImage = computed(() => {
		return getItemImage(props.showItem);
	});

	return {
		itemImage,
	};
};

// Anwendung der Composables
const { itemImage } = useImageManagement();

// Formatierte Daten
const itemTitle = computed(() => {
	return props.showItem?.title || props.showItem?.name || "";
});

const _itemType = computed(() => {
	return props.showItem?._type === "person" ? "Person" : "Venue";
});

const _itemLocation = computed(() => {
	return props.showItem?.location || "";
});

const contactLink = computed(() => {
	const contact = props.showItem?.contact;
	if (!contact) return "#";

	// E-Mail-Format prüfen
	if (contact.includes("@")) {
		return `mailto:${contact}`;
	}

	// Telefonnummer (vereinfachte Prüfung)
	if (/^\+?[0-9\s()-]+$/.test(contact)) {
		return `tel:${contact.replace(/\s/g, "")}`;
	}

	return contact;
});
</script>

<template>
	<div v-if="showItem" class="show-intro-content">
		<div class="show-intro-container">
			<!-- Tags-Icon -->
			<div v-if="showItem?.tags?.length" class="city-tags">
				<button
					v-for="(tag, index) in showItem.tags"
					:key="tag._id || index"
					class="tag city"
					type="button"
				>
					{{
						tag?.title?.[1]?.value
							? parseI18nObj(tag?.title)
							: tag?.title[0]?.value ?? tag.title
					}}
				</button>
			</div>

			<!-- Content-Bereich -->
			<div class="show-intro-info">
				<div class="show-intro-info-container">
					<!-- Titel-Bereich -->
					<div class="show-intro-header">
						<!-- Typ und Standort -->
						<div class="show-intro-title">
							<NuxtLink
								:to="getItemRoute(showItem)"
								class="show-intro-link"
								:aria-label="showItem?.title || showItem?.name"
							>
								<h2 class="show-intro-title">
									{{ itemTitle }}
								</h2>
							</NuxtLink>
						</div>
					</div>
					<!-- Hier die Teaser-Text Logik einfügen, analog zum ContentSlider -->
					<div v-if="showItem?.content" class="show-intro-text">
						<!-- Fall 1: Internationalisiertes Array mit mehreren Einträgen -->
						<!-- Debug-Ausgabe -->

						<RichText
							v-if="showItem.content"
							:blocks="showItem?.content"
							class="show-intro-text"
						/>
					</div>

					<div class="show-intro-bottom">
					<!-- Referenzierte Shows -->
					<div
						v-if="showItem.shows && showItem.shows.length > 0"
						class="show-intro-references-section"
					>
						<div class="show-intro-refs-list tags">
							<div
								v-for="show in showItem.shows"
								:key="show._id"
								class="show-intro-ref-item"
							>
								<NuxtLink :to="getItemRoute(show)" class="show-intro-ref-link">
									<div class="show-intro-ref-info">
										<svg
											width="22"
											height="22"
											viewBox="0 0 22 22"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<circle
												cx="11"
												cy="11"
												r="11"
												fill="#F794B3" />
											<path
												d="M16.7617 11.0002L8.11886 15.9901L8.11886 6.01023L16.7617 11.0002Z"
												fill="white"
											/>
										</svg>

										<h4 class="tag">{{ show.title }}</h4>
									</div>
								</NuxtLink>
							</div>
						</div>
					</div>

					<!-- Referenzierte Personen -->
					<div
						v-if="showItem.persons && showItem.persons.length > 0"
						class="show-intro-references-section"
					>
						<div class="show-intro-refs-list">
							<svg
								width="22"
								height="22"
								viewBox="0 0 22 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle
									cx="11"
									cy="11"
									r="11"
									fill="#557FB9" />
								<g clip-path="url(#clip0_6005_7912)">
									<path
										d="M11.2529 9.95997C12.0452 9.95997 12.8051 9.66 13.3654 9.12605C13.9257 8.59211 14.2404 7.86792 14.2404 7.1128C14.2404 6.35768 13.9257 5.63349 13.3654 5.09954C12.8051 4.56559 12.0452 4.26562 11.2529 4.26562C10.4605 4.26563 9.70065 4.56559 9.14037 5.09954C8.5801 5.63349 8.26534 6.35768 8.26534 7.1128C8.26534 7.86792 8.5801 8.59211 9.14037 9.12605C9.70065 9.66 10.4605 9.95997 11.2529 9.95997ZM11.2529 11.2109C7.28075 11.2109 4.73438 13.2999 4.73438 14.317V16.2162H17.7714V14.317C17.7714 13.087 15.3607 11.2109 11.2529 11.2109Z"
										fill="white"
									/>
								</g>
								<defs>
									<clipPath id="clip0_6005_7912">
										<rect
											width="14.6667"
											height="14.6667"
											fill="white"
											transform="translate(4.19141 2.09375)"
										/>
									</clipPath>
								</defs>
							</svg>
							<div
								v-for="person in showItem.persons"
								:key="person._id"
								class="show-intro-ref-item tags"
							>
								<NuxtLink
									v-if="person?.poolVisibility"
									:to="getItemRoute(person)"
									class="show-intro-ref-link"
								>
									<div class="show-intro-ref-info">
										<h4 class="tag">{{ person.title }}</h4>
									</div>
								</NuxtLink>
								<div v-else class="show-intro-ref-link no-link">
									<div class="show-intro-ref-info">
										<h4 class="tag">{{ person.title }}</h4>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Nur für Person: Referenzierte Veranstaltungsorte -->
					<div
						v-if="showItem.venues && showItem.venues.length > 0"
						class="show-intro-references-section"
					>
						<div class="show-intro-refs-list">
							<svg
								width="22"
								height="22"
								viewBox="0 0 22 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle
									cx="11"
									cy="11"
									r="11"
									fill="#557FB9" />
								<path
									d="M11 4.39844C7.96263 4.39844 5.5 6.7995 5.5 9.76094C5.5 10.9271 5.8921 11.9971 6.54385 12.8734C6.55554 12.8944 6.55737 12.9179 6.57067 12.938L10.2373 18.3005C10.4074 18.5492 10.6938 18.6984 11 18.6984C11.3062 18.6984 11.5926 18.5492 11.7627 18.3005L15.4293 12.938C15.4429 12.9179 15.4445 12.8944 15.4561 12.8734C16.1079 11.9971 16.5 10.9271 16.5 9.76094C16.5 6.7995 14.0374 4.39844 11 4.39844ZM11 11.5484C9.98754 11.5484 9.16667 10.7481 9.16667 9.76094C9.16667 8.77379 9.98754 7.97344 11 7.97344C12.0125 7.97344 12.8333 8.77379 12.8333 9.76094C12.8333 10.7481 12.0125 11.5484 11 11.5484Z"
									fill="white"
								/>
							</svg>
							<div
								v-for="venue in showItem.venues"
								:key="venue._id"
								class="show-intro-ref-item"
							>
								<NuxtLink :to="getItemRoute(venue)" class="show-intro-ref-link">
									<div class="show-intro-ref-info">
										<h4 class="tag">{{ venue.title }}</h4>
									</div>
								</NuxtLink>
							</div>
						</div>
					</div>
					<!-- Contact -->
					<div
						v-if="showItem?.contact || showItem?.socials"
						class="show-intro-contact-section tags"
					>
						<div v-if="showItem?.contact" class="show-intro-contact tags"/>
						<div class="show-intro-socials tags">
							<a
								:href="contactLink"
								target="_blank"
								rel="noopener noreferrer"
							><span class="contact-icon tag">Contact</span></a
							>
							<a
								v-if="showItem?.socials?.instagram"
								:href="showItem?.socials?.instagram"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Instagram"
							><svg
								width="22"
								height="22"
								viewBox="0 0 22 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle
									cx="11.1062"
									cy="11.4773"
									r="9.56522"
									fill="white" />
								<path
									d="M14.2793 5.85352H7.7223C6.67571 5.85352 5.82422 6.70501 5.82422 7.7516V14.3086C5.82422 15.3552 6.67571 16.2069 7.7223 16.2069H14.2793C15.3259 16.2069 16.1776 15.3554 16.1776 14.3086V7.7516C16.1776 6.70501 15.3261 5.85352 14.2793 5.85352ZM11.0008 14.4385C9.1216 14.4385 7.59264 12.9096 7.59264 11.0301C7.59264 9.15089 9.1216 7.62194 11.0008 7.62194C12.8803 7.62194 14.4092 9.15089 14.4092 11.0301C14.4092 12.9093 12.88 14.4385 11.0008 14.4385ZM14.5188 8.32661C14.0739 8.32661 13.7121 7.96484 13.7121 7.52022C13.7121 7.0756 14.0739 6.71383 14.5188 6.71383C14.9634 6.71383 15.3252 7.0756 15.3252 7.52022C15.3252 7.96484 14.9634 8.32661 14.5188 8.32661Z"
									fill="#2C2C2C"
								/>
								<path
									d="M10.9994 9.0625C9.9146 9.0625 9.03125 9.94536 9.03125 11.0302C9.03125 12.1155 9.9146 12.9986 10.9994 12.9986C12.0847 12.9986 12.9674 12.1155 12.9674 11.0302C12.9674 9.94561 12.0845 9.0625 10.9994 9.0625Z"
									fill="#2C2C2C"
								/>
								<path
									d="M11 0C4.92511 0 0 4.92511 0 11C0 17.0749 4.92511 22 11 22C17.0749 22 22 17.0749 22 11C22 4.92511 17.0749 0 11 0ZM17.6168 14.3082C17.6168 16.1491 16.1195 17.6465 14.2785 17.6465H7.7215C5.88077 17.6465 4.38319 16.1491 4.38319 14.3082V7.75115C4.38319 5.91043 5.88077 4.41284 7.7215 4.41284H14.2785C16.1195 4.41284 17.6168 5.91043 17.6168 7.75115V14.3082Z"
									fill="#2C2C2C"
								/>
							</svg>
							</a>
							<a
								v-if="showItem?.socials?.soundcloud"
								:href="showItem?.socials?.soundcloud"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Soundcloud"
							>
								<svg
									width="22"
									height="22"
									viewBox="0 0 22 22"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M11 22C17.0751 22 22 17.0751 22 11C22 4.92487 17.0751 0 11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22Z"
										fill="#2C2C2C"
									/>
									<path
										d="M3.27518 13.4965C3.26989 13.5322 3.24439 13.5577 3.21126 13.5577C3.17812 13.5577 3.15263 13.5322 3.14753 13.4957L3.03125 12.6255L3.14753 11.7408C3.15243 11.7039 3.17792 11.6784 3.21126 11.6784C3.2442 11.6784 3.26969 11.7039 3.27518 11.7408L3.41362 12.6265L3.27518 13.4965ZM3.86755 14.0252C3.86206 14.063 3.83461 14.0895 3.80069 14.0895C3.76775 14.0895 3.73892 14.063 3.73441 14.0252L3.57794 12.6253L3.73441 11.1941C3.73912 11.1572 3.76775 11.1298 3.80069 11.1298C3.83461 11.1298 3.86206 11.1566 3.86755 11.1941L4.0456 12.6253L3.86755 14.0252ZM4.50679 14.2622C4.50228 14.3077 4.46816 14.3401 4.42718 14.3401C4.38483 14.3401 4.3513 14.3077 4.34718 14.2622L4.19874 12.6265L4.34718 10.9286C4.3509 10.8825 4.38483 10.8496 4.42718 10.8496C4.46816 10.8496 4.50209 10.8825 4.50679 10.9286L4.67523 12.6265L4.50679 14.2622ZM5.15231 14.3142C5.1476 14.3664 5.10681 14.4058 5.05838 14.4058C5.00877 14.4058 4.96818 14.3664 4.96406 14.3142L4.82386 12.6265L4.96406 10.8819C4.96818 10.8294 5.00877 10.79 5.05838 10.79C5.10681 10.79 5.1476 10.8294 5.15231 10.8819L5.31133 12.6265L5.15231 14.3142ZM5.80135 14.3277C5.79801 14.3883 5.75076 14.4332 5.69487 14.4332C5.63722 14.4332 5.59154 14.3883 5.58762 14.3277L5.45506 12.6263L5.58762 11.0078C5.59173 10.9476 5.63722 10.9027 5.69487 10.9027C5.75174 10.9027 5.79801 10.9476 5.80135 11.007L5.95155 12.6263L5.80135 14.3277ZM6.45667 14.3287V14.3277C6.45274 14.3948 6.3996 14.4477 6.33568 14.4477C6.27156 14.4477 6.21842 14.3946 6.2147 14.3287L6.09097 12.6273L6.2147 9.99405C6.21842 9.92699 6.27156 9.87405 6.33568 9.87405C6.3998 9.87405 6.45294 9.92719 6.45667 9.99307L6.59687 12.6273L6.45667 14.3287ZM7.10708 14.3277V14.3268C7.10316 14.4009 7.04453 14.4599 6.97198 14.4599C6.9008 14.4599 6.84197 14.4009 6.83844 14.3268L6.72158 12.6363L6.83844 9.4007C6.84197 9.32658 6.9008 9.26795 6.97198 9.26795C7.04453 9.26795 7.10316 9.32658 7.10708 9.4007L7.23865 12.6363L7.10708 14.3277ZM7.78181 14.3017V14.3007C7.77887 14.3832 7.71396 14.4473 7.63416 14.4473C7.55435 14.4473 7.48945 14.3832 7.48651 14.3017L7.37807 12.6285C7.37807 12.6285 7.48651 9.12324 7.48651 9.12226C7.48964 9.04068 7.55435 8.97539 7.63416 8.97539C7.71396 8.97539 7.77907 9.04068 7.78181 9.12226L7.90436 12.6285L7.78181 14.3017ZM8.45262 14.2905C8.44948 14.3803 8.37909 14.4507 8.29144 14.4507C8.20359 14.4507 8.1332 14.3803 8.13006 14.2913L8.02888 12.6281L8.13006 9.0048C8.1332 8.9146 8.20359 8.8444 8.29144 8.8444C8.37909 8.8444 8.44968 8.9146 8.45262 9.0048L8.56498 12.6281L8.45262 14.2905ZM9.12774 14.2758V14.2748C9.1246 14.3719 9.04872 14.4489 8.95244 14.4489C8.85753 14.4489 8.78008 14.3719 8.77832 14.2758L8.68537 12.6285L8.77734 9.09775C8.78008 8.99931 8.85734 8.92323 8.95244 8.92323C9.04872 8.92323 9.1246 8.99931 9.12774 9.09775L9.23206 12.6285L9.12774 14.2758ZM9.80835 14.266V14.2646C9.80678 14.3703 9.72325 14.4517 9.62011 14.4517C9.51619 14.4517 9.43383 14.3703 9.43069 14.266L9.34677 12.6283L9.43089 9.22677C9.43403 9.12128 9.51638 9.03872 9.62031 9.03872C9.72345 9.03872 9.80698 9.12128 9.80855 9.22677L9.90365 12.6292L9.80835 14.266ZM10.5027 14.0932L10.4943 14.2536C10.4933 14.3095 10.4697 14.3601 10.4339 14.3966C10.397 14.4324 10.3464 14.4554 10.2929 14.4554C10.2305 14.4554 10.1756 14.4268 10.138 14.3817C10.1101 14.3489 10.0929 14.3066 10.0909 14.262C10.0903 14.2601 10.0903 14.2575 10.0903 14.2548C10.0903 14.2548 10.0129 12.63 10.0129 12.6273L10.0893 8.61871L10.0903 8.58028C10.0909 8.51008 10.1282 8.44753 10.1839 8.41164C10.215 8.39086 10.2519 8.3787 10.2931 8.3787C10.3335 8.3787 10.3717 8.39125 10.4037 8.41341C10.458 8.44968 10.4935 8.51067 10.4945 8.58047L10.5796 12.6292L10.5027 14.0932ZM11.1774 14.2326V14.2307C11.176 14.3491 11.079 14.4456 10.9617 14.4456C10.8441 14.4456 10.7472 14.3491 10.746 14.2317L10.7015 13.4414L10.6578 12.63L10.746 8.23654V8.21438C10.7462 8.14771 10.7776 8.0881 10.826 8.0479C10.8631 8.01751 10.9107 7.99908 10.9617 7.99908C11.0023 7.99908 11.04 8.01026 11.0721 8.02908C11.1335 8.06751 11.1764 8.13555 11.1784 8.2134L11.2739 12.6298L11.1774 14.2326ZM17.0076 14.4499C17.0076 14.4499 11.5794 14.4499 11.5737 14.4499C11.4565 14.4379 11.3637 14.3446 11.3617 14.2244V8.00378C11.3637 7.88927 11.4031 7.83025 11.5506 7.77358C11.9312 7.62612 12.3622 7.53906 12.8051 7.53906C14.6121 7.53906 16.0927 8.92519 16.2498 10.6909C16.4823 10.5939 16.7392 10.5386 17.0076 10.5386C18.0896 10.5386 18.9669 11.4163 18.9669 12.499C18.9669 13.5816 18.0896 14.4499 17.0076 14.4499Z"
										fill="white"
									/>
								</svg>
							</a>
							<a
								v-if="showItem?.socials?.nina"
								:href="showItem?.socials?.nina"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Nina"
							>
								<span class="social-icon tag">Nina</span>
							</a>
							<a
								v-if="showItem?.socials?.bandcamp"
								:href="showItem?.socials?.bandcamp"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Bandcamp"
							>
								<span class="social-icon tag">Bandcamp</span>
							</a>
							<a
								v-if="showItem?.socials?.web"
								:href="showItem?.socials?.web"
								target="_blank"
								rel="noopener noreferrer"
								aria-label="Website"
							><svg
								width="22"
								height="22"
								viewBox="0 0 22 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<circle
									cx="11"
									cy="11"
									r="11"
									fill="#2C2C2C" />
								<path
									d="M16.4757 7.97403C16.4329 7.65492 16.3297 7.35489 16.1797 7.06788C16.0337 6.78926 15.8434 6.54039 15.6109 6.32223C15.3818 6.10686 15.1212 5.9315 14.8292 5.79566C14.516 5.64913 14.1871 5.55378 13.84 5.51843C13.339 5.46586 12.8547 5.5254 12.3851 5.7017C11.9948 5.84823 11.6541 6.06267 11.3581 6.33991C10.8645 6.80321 10.3738 7.26977 9.88171 7.73543C9.84287 7.77218 9.80501 7.81172 9.76224 7.85451H9.80993C9.9648 7.84242 10.1197 7.82707 10.2755 7.8187C10.4972 7.808 10.7175 7.828 10.9363 7.86289C11.1816 7.90103 11.422 7.95825 11.6536 8.04849C11.6802 8.05919 11.6939 8.05081 11.7102 8.03407C11.8208 7.92429 11.9304 7.81498 12.0435 7.70799C12.1718 7.58519 12.3026 7.46611 12.4309 7.34376C12.5784 7.20189 12.748 7.09257 12.9442 7.02234C13.2249 6.92093 13.512 6.89488 13.8075 6.95442C14.1777 7.02932 14.4732 7.21538 14.6999 7.49727C14.925 7.77823 15.0194 8.10105 14.9904 8.45364C14.9604 8.82019 14.7967 9.12626 14.5199 9.3849C13.8552 10.0078 13.1958 10.6338 12.5361 11.2604C12.4141 11.3758 12.2907 11.4893 12.1408 11.5735C11.9368 11.6889 11.7155 11.7558 11.48 11.7712C11.1791 11.7917 10.8935 11.7307 10.6304 11.5902C10.306 11.4163 10.0842 11.1614 9.96327 10.8269C9.95442 10.8032 9.94163 10.7804 9.92541 10.746C9.85363 10.8009 9.78431 10.8446 9.72679 10.8995C9.42835 11.1781 9.13287 11.4591 8.8369 11.7391C8.82559 11.7498 8.80937 11.7605 8.80544 11.7749C8.80052 11.7917 8.79806 11.8131 8.80544 11.8275C8.82166 11.8586 8.84673 11.8856 8.86689 11.9168C9.06699 12.2229 9.32609 12.4787 9.63976 12.6825C10.0174 12.9276 10.4303 13.0932 10.8871 13.1625C11.1236 13.1983 11.3605 13.209 11.598 13.1923C11.92 13.1695 12.2322 13.0992 12.5292 12.9802C12.8325 12.8597 13.1118 12.7001 13.3537 12.4871C13.5336 12.3289 13.7087 12.1643 13.8822 12.0001C14.4211 11.4916 14.957 10.9809 15.4983 10.4747C15.7313 10.2571 15.9452 10.0268 16.106 9.75654C16.2835 9.45884 16.4093 9.14346 16.4634 8.80388C16.5076 8.52897 16.5135 8.25127 16.4762 7.97403L16.4757 7.97403Z"
									fill="white"
								/>
								<path
									d="M12.1029 14.1601C11.8955 14.1768 11.6876 14.1884 11.4787 14.1768C11.1086 14.1578 10.7489 14.0945 10.4019 13.9699C10.3464 13.9494 10.3139 13.9531 10.2687 13.9973C10.0559 14.207 9.83721 14.4117 9.61949 14.6163C9.48089 14.7475 9.32903 14.8614 9.14915 14.9391C8.76531 15.1032 8.3741 15.1223 7.97798 14.9842C7.61674 14.8581 7.34644 14.6293 7.17 14.3066C7.0201 14.0317 6.96751 13.7373 7.02157 13.4304C7.07318 13.1434 7.19653 12.8886 7.41524 12.6802C7.53122 12.5695 7.64524 12.4598 7.76123 12.3491C7.97896 12.1421 8.19667 11.9347 8.4144 11.7278C8.56921 11.5803 8.72501 11.4338 8.87981 11.2873C8.95796 11.2125 9.03463 11.1362 9.11376 11.0622C9.23318 10.9502 9.35556 10.8409 9.47253 10.7255C9.65389 10.5456 9.85883 10.4005 10.1055 10.3126C10.3709 10.2172 10.6442 10.1972 10.9209 10.253C11.4217 10.353 11.78 10.6232 11.9928 11.065C12.0193 11.1208 12.0419 11.1794 12.0709 11.2473C12.1324 11.2032 12.1982 11.1664 12.2508 11.1176C12.5604 10.8283 12.8671 10.5353 13.1758 10.2451C13.2072 10.2154 13.2057 10.1902 13.1846 10.1582C13.0612 9.97957 12.9305 9.80703 12.7718 9.65355C12.4789 9.37032 12.1378 9.15453 11.75 9.0071C11.5161 8.91781 11.2733 8.85967 11.0226 8.82712C10.8098 8.80108 10.5975 8.79271 10.3862 8.80945C10.0564 8.83549 9.73695 8.90944 9.43274 9.03547C9.15604 9.14988 8.89802 9.29405 8.67539 9.48798C8.48912 9.64983 8.30777 9.81771 8.12937 9.987C7.5519 10.5311 6.97442 11.0762 6.3994 11.6226C6.27506 11.7403 6.15906 11.8668 6.05733 12.0035C5.90251 12.2119 5.77817 12.4356 5.68381 12.6751C5.56045 12.9904 5.5 13.3155 5.5 13.6512C5.5 13.9191 5.53637 14.1809 5.61451 14.4372C5.70494 14.7325 5.84354 15.0088 6.02734 15.2636C6.19444 15.4957 6.39201 15.7008 6.62497 15.8757C7.00095 16.1589 7.4241 16.3458 7.89596 16.4389C8.10877 16.4807 8.32354 16.5021 8.54028 16.5007C8.78799 16.4984 9.0347 16.4672 9.27355 16.4091C9.5011 16.3542 9.71636 16.264 9.92524 16.1617C10.1041 16.0738 10.2737 15.971 10.4211 15.8436C10.6615 15.6366 10.8915 15.4185 11.1229 15.2032C11.4198 14.9269 11.7157 14.647 12.011 14.3684C12.0877 14.2968 12.1609 14.2219 12.2361 14.1493C12.2361 14.1456 12.2337 14.1433 12.2322 14.14C12.1894 14.1461 12.1467 14.1554 12.1025 14.1591L12.1029 14.1601Z"
									fill="white"
								/>
							</svg>
							</a>
						</div>
					</div>
					</div>
				</div>
			</div>
			<!-- Bild/Media-Bereich -->
			<div class="show-intro-media">
				<NuxtLink
					:to="getItemRoute(showItem)"
					class="show-intro-link"
					:aria-label="showItem?.title || showItem?.name"
				>
					<MediaImage
						:image="itemImage"
						:alt="showItem?.title || showItem?.name"
						class="show-intro-image"
					/>
				</NuxtLink>
			</div>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.show-intro-content {
  width: var(--page-max-width);
  max-width: 100%;
  margin: var(--big-margin) auto 0;
  display: flex;
  flex-flow: column wrap;
  justify-content: center;
  position: relative;

  @media screen and (max-width: 900px) {
    margin: 0 auto 0;
    padding-top: calc(var(--city-tag-height) + var(--base-margin));
  }

  .city-tags {
    top: 0;
    left: 1.5625rem;
    transform: translate(0, calc(-100% - 0.0625rem));
    position: absolute;
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;

    @media screen and (max-width: 900px) {
      left: var(--base-margin);
    }

    .tag {
      background-color: var(--color-pink);
    }
  }

  .show-intro-container {
    display: flex;
    flex-flow: row wrap;
    justify-content: space-between;
    align-items: stretch;
    gap: 0;
    width: 100%;
    max-width: var(--page-max-width);
    background-color: var(--color-text);
    border: 0.0625rem solid var(--color-text);
    border-radius: 1.5625rem;
    overflow: hidden;

    @media screen and (max-width: 900px) {
      flex-flow: column wrap;
      justify-content: flex-start;
    }

    .show-intro-media {
      aspect-ratio: 1 / 1;
      width: 50%;
      flex-shrink: 0;
      overflow: hidden;

      @media screen and (max-width: 900px) {
        order: -1;
        width: 100%;
        border-bottom: 0.0625rem solid var(--color-text);
      }

      .show-intro-image,
      .show-intro-image-placeholder,
      :deep(img) {
        object-fit: cover;
        z-index: 0;
        height: 100%;
        width: 100%;
        display: block;
        aspect-ratio: 1 / 1;
      }
    }
  }

  .show-intro-info {
    width: 50%;
    shape-rendering: crispEdges;
    z-index: 10;
    border-right: 0.0625rem solid var(--color-text);

    @media screen and (max-width: 900px) {
      width: 100%;
      border-right: none;
    }

    .show-intro-type-icon {
      display: flex;
      flex-flow: column wrap;
      justify-content: center;
      align-items: center;
      border-radius: 100px;
      aspect-ratio: 1/1;
      width: max-content;
      width: 4rem;
      height: 4rem;

      svg {
        width: calc(4rem - var(--base-padding) * 2);
        height: calc(4rem - var(--base-padding) * 2);
        path {
          fill: var(--color-black);
        }
      }
    }

    &-container {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: var(--mid-margin);
      background-color: var(--color-text);
      padding: var(--big-margin);

      @media screen and (max-width: 900px) {
        min-height: 0;
        height: auto;
        padding: var(--base-margin) var(--base-margin) var(--big-margin);
      }
    }

    .show-intro-bottom {
      margin-top: auto;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--mid-padding);
      flex-shrink: 0;
    }

    .show-intro-header {
      display: flex;
      flex-flow: column wrap;
      justify-content: center;
      gap: var(--mid-padding);

      .show-intro-item-title {
        display: flex;
        flex-flow: row wrap;
        justify-content: flex-start;
      }

      .show-intro-title {
        font-size: var(--h2-size);
        font-weight: 400;
        text-transform: uppercase;
        width: 100%;
        color: var(--color-bg);
      }

      .show-intro-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .show-intro-type,
        .show-intro-location {
          font-size: var(--small-font-size);
          text-transform: uppercase;
        }
      }
    }
    .show-intro-text {
      margin: 0 0 calc(var(--big-margin) - var(--mid-margin)) 0;

      & > * {
        color: var(--color-bg);
        font-size: var(--base-font-size);
        line-height: var(--base-line-height);
      }
    }
    .show-intro-contact-section,
    .show-intro-references-section {
      margin: 0;
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      flex-shrink: 0;

      h3 {
        font-size: var(--h3-size);
        margin-bottom: var(--base-padding);
        color: var(--color-bg);
        text-transform: uppercase;
      }
    }

    .show-intro-contact {
      a {
        color: var(--color-white);
        background-color: var(--color-darker-grey);
        text-decoration: none;
        &:hover {
          @media (min-width: 1024px) {
            background-color: var(--color-blue);
            color: var(--color-white);
          }
        }
      }
    }

    .show-intro-socials {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;

      gap: var(--base-padding);

      a {
        text-decoration: none;

        .social-icon,
        .contact-icon {
          display: inline-block;
          font-size: var(--small-font-size);
          color: var(--color-white);
          background-color: var(--color-darker-grey);
          text-decoration: none;
          &:hover {
            @media (min-width: 1024px) {
              background-color: var(--color-blue);
              color: var(--color-white);
            }
          }
        }
      }
    }

    .show-intro-refs-list {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--base-padding);

      .show-intro-ref-item {
        border-radius: 8px;
        overflow: hidden;
        background-color: rgba(var(--color-bg-rgb), 0.1);

        .show-intro-ref-link {
          display: block;
          text-decoration: none;
          color: var(--color-bg);
          height: 100%;

          &.no-link {
            pointer-events: none;
          }

          .show-intro-ref-info {
            display: flex;
            flex-flow: row wrap;
            justify-content: flex-start;
            align-items: center;
            gap: var(--base-padding);
            h4 {
              font-size: var(--small-font-size);
              background-color: var(--color-grey);
              color: var(--color-black);
              &:hover {
                @media (min-width: 1024px) {
                  background-color: var(--color-blue);
                  color: var(--color-white);
                }
              }
            }
          }
        }

        .show-intro-ref-image {
          aspect-ratio: 1/1;
          overflow: hidden;

          img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        }

        .show-intro-ref-info {
          h4 {
            font-size: var(--base-font-size);
            margin-bottom: 0.25rem;
          }

          .show-intro-set-count,
          .show-intro-venue-location {
            font-size: var(--small-font-size);
            opacity: 0.8;
          }
        }
      }
    }
  }
}
</style>