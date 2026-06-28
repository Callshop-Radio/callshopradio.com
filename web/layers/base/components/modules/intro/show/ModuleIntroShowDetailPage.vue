<script setup lang="ts">
import { computed } from "vue";
import { useMainStore } from "~/stores/mainStore";
import type { Image } from "~/types/sanity";

const { locale: _locale, setLocale: _setLocale } = useI18n();
// Type definitions
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

// Composable for image management
const useImageManagement = () => {
	// Helper function for image fetching and fallbacks
	function getItemImage(item?: PoolItem): Image | null {
		if (!item) return null;

		// Image from the item itself
		if (item.image || item.mainImage) {
			return item.image || item.mainImage;
		}

		// Fallbacks depending on content type
		if (item._type === "person") {
			return mainStore?.siteFallbacks?.fallbackPerson?.image;
		} else if (item._type === "venue") {
			return mainStore?.siteFallbacks?.fallbackVenue?.image;
		}

		// General fallback
		return mainStore?.siteFallbacks?.fallbackPerson?.image;
	}

	// Computed property for the image
	const itemImage = computed(() => {
		return getItemImage(props.showItem);
	});

	return {
		itemImage,
	};
};

// Application of the composables
const { itemImage } = useImageManagement();

// Formatted data
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

	// Check email format
	if (contact.includes("@")) {
		return `mailto:${contact}`;
	}

	// Phone number (simplified check)
	if (/^\+?[0-9\s()-]+$/.test(contact)) {
		return `tel:${contact.replace(/\s/g, "")}`;
	}

	return contact;
});
</script>

<template>
	<div v-if="showItem" class="show-intro-content">
		<div class="show-intro-container">
			<!-- Tags icon -->
			<div v-if="showItem?.tags?.length" class="city-tags">
				<button
					v-for="(tag, index) in showItem.tags"
					:key="tag._id || index"
					class="tag city"
					type="button"
				>
						{{ getI18nLabel(tag?.title) }}
				</button>
			</div>

			<!-- Content area -->
			<div class="show-intro-info">
				<div class="show-intro-info-container">
					<!-- Title area -->
					<div class="show-intro-header">
						<!-- Type and location -->
						<div class="show-intro-title">
							<ElementsContentLink
								:item="showItem"
								class="show-intro-link"
								:aria-label="showItem?.title || showItem?.name"
							>
								<h2 class="show-intro-title">
									{{ itemTitle }}
								</h2>
							</ElementsContentLink>
						</div>
					</div>
					<!-- Insert the teaser text logic here, analogous to the ContentSlider -->
					<div v-if="showItem?.content" class="show-intro-text">
						<!-- Case 1: Internationalized array with multiple entries -->
						<!-- Debug output -->

						<RichText
							v-if="showItem.content"
							:blocks="showItem?.content"
							class="show-intro-text"
						/>
					</div>

					<div class="show-intro-bottom">
					<!-- Referenced shows -->
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
								<ElementsContentLink :item="show" class="show-intro-ref-link">
									<div class="show-intro-ref-info">
										<svg
											viewBox="0 0 22 22"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
											class="detail-ref-icon"
											aria-hidden="true"
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
								</ElementsContentLink>
							</div>
						</div>
					</div>

					<!-- Referenced persons -->
					<div
						v-if="showItem.persons && showItem.persons.length > 0"
						class="show-intro-references-section"
					>
						<div class="show-intro-refs-list">
							<svg
								viewBox="0 0 22 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								class="detail-ref-icon"
								aria-hidden="true"
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
								<ElementsContentLink
									v-if="person?.poolVisibility"
									:pool="person"
									class="show-intro-ref-link"
								>
									<div class="show-intro-ref-info">
										<h4 class="tag">{{ person.title }}</h4>
									</div>
								</ElementsContentLink>
								<div v-else class="show-intro-ref-link no-link">
									<div class="show-intro-ref-info">
										<h4 class="tag">{{ person.title }}</h4>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Only for person: referenced venues -->
					<div
						v-if="showItem.venues && showItem.venues.length > 0"
						class="show-intro-references-section"
					>
						<div class="show-intro-refs-list">
							<svg
								viewBox="0 0 22 22"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
								class="detail-ref-icon"
								aria-hidden="true"
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
								<ElementsContentLink :item="venue" class="show-intro-ref-link">
									<div class="show-intro-ref-info">
										<h4 class="tag">{{ venue.title }}</h4>
									</div>
								</ElementsContentLink>
							</div>
						</div>
					</div>
						<IntroSocialLinks
							:socials="showItem?.socials"
							:contact="showItem?.contact"
							:contact-href="contactLink"
						/>
					</div>
				</div>
			</div>
			<!-- Image/media area -->
			<div class="show-intro-media">
				<ElementsContentLink
					:item="showItem"
					class="show-intro-link"
					:aria-label="showItem?.title || showItem?.name"
				>
					<MediaImage
						:image="itemImage"
						:alt="showItem?.title || showItem?.name"
						class="show-intro-image"
						:eager="true"
					/>
				</ElementsContentLink>
			</div>
		</div>
	</div>
</template>

<style lang="postcss" scoped>
.show-intro-content {
  --detail-chip-size: calc(
    var(--small-font-size) + var(--small-padding) * 2 + 0.2rem
  );

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
      gap: var(--big-padding);
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

    .show-intro-refs-list {
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      gap: var(--base-padding);

      > .detail-ref-icon {
        width: var(--detail-chip-size);
        height: var(--detail-chip-size);
        flex-shrink: 0;
      }

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

            .detail-ref-icon {
              width: var(--detail-chip-size);
              height: var(--detail-chip-size);
              flex-shrink: 0;
            }

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