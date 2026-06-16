<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { useMainStore } from "~/stores/mainStore";
import type { Image } from "~/types/sanity";

const { locale: _locale, setLocale: _setLocale } = useI18n();
const { getItemRoute } = useContentRoute();

// Template-Referenzen (wie Set für Höhen-Sync)
const _poolContentRef = ref<HTMLElement | null>(null);
const poolMainRef = ref<HTMLElement | null>(null);
const poolMainHeight = ref(0);
const windowWidth = ref(0);

// Typdefinitionen
interface Tag {
	_id?: string;
	_type?: string;
	title?: string | unknown;
	short?: string;
}

interface PoolItem {
	_id?: string;
	_type?: string;
	title?: string;
	name?: string;
	description?: object;
	slug?: { current?: string };
	image?: Image;
	mainImage?: Image;
	location?: string;
	tags?: Tag[];
	otherTags?: Tag[];
	cityTags?: Tag[];
	bio?: unknown[];
	contact?: string;
	socials?: Record<string, string>;
	shows?: Array<{
		_id?: string;
		title?: string;
		slug?: { current?: string };
		_type?: string;
	}>;
	persons?: Array<{
		_id?: string;
		title?: string;
		image?: Image;
		slug?: { current?: string };
	}>;
	venues?: Array<{ _id?: string; title?: string; slug?: { current?: string } }>;
}

// Props
const props = defineProps<{
	poolItem: PoolItem;
}>();

// Store
const mainStore = useMainStore();

// Composable für Bild-Management
const useImageManagement = () => {
	function getItemImage(item?: PoolItem): Image | null {
		if (!item) return null;
		if (item.image || item.mainImage) {
			return item.image || item.mainImage;
		}
		if (item._type === "person") {
			return mainStore?.siteFallbacks?.fallbackPerson?.image;
		}
		if (item._type === "venue") {
			return mainStore?.siteFallbacks?.fallbackVenue?.image;
		}
		return mainStore?.siteFallbacks?.fallbackPerson?.image;
	}

	const itemImage = computed(() => getItemImage(props.poolItem));
	return { itemImage };
};

const { itemImage } = useImageManagement();

const _itemTitle = computed(() => {
	return props.poolItem?.title || props.poolItem?.name || "";
});

const _displayTags = computed(() => {
	return props.poolItem?.otherTags ?? props.poolItem?.tags ?? [];
});

const _contactLink = computed(() => {
	const contact = props.poolItem?.contact;
	if (!contact) return "#";
	if (contact.includes("@")) return `mailto:${contact}`;
	if (/^\+?[0-9\s()-]+$/.test(contact)) {
		return `tel:${contact.replace(/\s/g, "")}`;
	}
	return contact;
});

// Höhen-Sync wie bei Set (rechte Spalte = gleiche Höhe wie linke)
const computedPoolMainHeight = computed(() => {
	if (windowWidth.value <= 900) return "100%";
	return poolMainHeight.value;
});

const _poolDetailsStyle = computed(() => {
	const h = computedPoolMainHeight.value;
	if (typeof h === "string") return `max-height: ${h}; height: ${h}`;
	return `max-height: ${h}px; height: ${h}px`;
});

const updatePoolMainHeight = () => {
	if (poolMainRef.value) poolMainHeight.value = poolMainRef.value.offsetHeight;
};

const updateWindowWidth = () => {
	if (typeof window !== "undefined") windowWidth.value = window.innerWidth;
};

onMounted(() => {
	nextTick();
	updatePoolMainHeight();
	updateWindowWidth();
	if (typeof window !== "undefined" && poolMainRef.value) {
		const resizeObserver = new ResizeObserver(() => updatePoolMainHeight());
		resizeObserver.observe(poolMainRef.value);
		window.addEventListener("resize", () => {
			updateWindowWidth();
			updatePoolMainHeight();
		});
		const mutationObserver = new MutationObserver(() => updatePoolMainHeight());
		mutationObserver.observe(poolMainRef.value, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["style", "class"],
		});
	}
});
</script>

<template>
  <div v-if="poolItem" ref="poolContentRef" class="pool-intro">
    <div ref="poolMainRef" class="pool-intro-content">
      <div class="pool-container">
        <div class="pool-details-inner">
          <div class="pool-header">
            <div class="pool-title">
              <NuxtLink
                :to="getItemRoute(poolItem)"
                class="pool__link pool-title"
                :aria-label="itemTitle"
              >
                <h2 class="pool-title">
                  {{ itemTitle }}
                </h2>
              </NuxtLink>
            </div>
            <div v-if="poolItem?.cityTags?.length || displayTags.length > 0" class="pool-tags tags">
              <button
                v-for="(tag, index) in poolItem?.cityTags"
                :key="tag._id || index"
                class="tag"
                type="button"
              >
                {{
                  tag?.title?.[1]?.value
                    ? parseI18nObj(tag?.title)
                    : (tag?.title?.[0]?.value ?? tag.title)
                }}
              </button>
			  <button
                v-for="(tag, index) in poolItem?.otherTags"
                :key="tag._id || index"
                class="tag"
                type="button"
              >
                {{
                  tag?.title?.[1]?.value
                    ? parseI18nObj(tag?.title)
                    : (tag?.title?.[0]?.value ?? tag.title)
                }}
              </button>
            </div>
          </div>

          <div class="pool-meta-bottom">
            <section
              v-if="poolItem.shows && poolItem.shows.length > 0"
              class="pool-references-section"
            >
              <div class="pool-refs-list tags">
                <div
                  v-for="show in poolItem.shows"
                  :key="show._id"
                  class="pool-ref-item"
                >
                  <NuxtLink :to="getItemRoute(show)" class="pool-ref-link">
                    <div class="pool-ref-info">
                      <svg
                        viewBox="0 0 22 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                        class="detail-ref-icon detail-ref-icon--show"
                      >
                        <circle cx="11" cy="11" r="11" fill="#F794B3" />
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
            </section>

            <section
              v-if="
                poolItem._type === 'venue' ||
                  (poolItem._type === 'person' &&
                    poolItem.persons &&
                    poolItem.persons.length > 0)
              "
              class="pool-references-section"
            >
              <div class="pool-refs-list">
                <svg
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  class="detail-ref-icon detail-ref-icon--pool"
                >
                  <circle cx="11" cy="11" r="11" fill="#557FB9" />
                  <path
                    d="M11 4.39844C7.96263 4.39844 5.5 6.7995 5.5 9.76094C5.5 10.9271 5.8921 11.9971 6.54385 12.8734C6.55554 12.8944 6.55737 12.9179 6.57067 12.938L10.2373 18.3005C10.4074 18.5492 10.6938 18.6984 11 18.6984C11.3062 18.6984 11.5926 18.5492 11.7627 18.3005L15.4293 12.938C15.4429 12.9179 15.4445 12.8944 15.4561 12.8734C16.1079 11.9971 16.5 10.9271 16.5 9.76094C16.5 6.7995 14.0374 4.39844 11 4.39844ZM11 11.5484C9.98754 11.5484 9.16667 10.7481 9.16667 9.76094C9.16667 8.77379 9.98754 7.97344 11 7.97344C12.0125 7.97344 12.8333 8.77379 12.8333 9.76094C12.8333 10.7481 12.0125 11.5484 11 11.5484Z"
                    fill="white"
                  />
                </svg>
                <div
                  v-for="person in poolItem.persons"
                  :key="person._id"
                  class="pool-ref-item tags"
                >
                  <NuxtLink :to="getItemRoute(person)" class="pool-ref-link">
                    <h4 class="tag">{{ person.title }}</h4>
                  </NuxtLink>
                </div>
              </div>
            </section>

            <section
              v-if="
                poolItem._type === 'person' &&
                  poolItem.venues &&
                  poolItem.venues.length > 0
              "
              class="pool-references-section"
            >
              <div class="pool-refs-list">
                <svg
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  class="detail-ref-icon detail-ref-icon--pool"
                >
                  <circle cx="11" cy="11" r="11" fill="#557FB9" />
                  <path
                    d="M11 4.39844C7.96263 4.39844 5.5 6.7995 5.5 9.76094C5.5 10.9271 5.8921 11.9971 6.54385 12.8734C6.55554 12.8944 6.55737 12.9179 6.57067 12.938L10.2373 18.3005C10.4074 18.5492 10.6938 18.6984 11 18.6984C11.3062 18.6984 11.5926 18.5492 11.7627 18.3005L15.4293 12.938C15.4429 12.9179 15.4445 12.8944 15.4561 12.8734C16.1079 11.9971 16.5 10.9271 16.5 9.76094C16.5 6.7995 14.0374 4.39844 11 4.39844ZM11 11.5484C9.98754 11.5484 9.16667 10.7481 9.16667 9.76094C9.16667 8.77379 9.98754 7.97344 11 7.97344C12.0125 7.97344 12.8333 8.77379 12.8333 9.76094C12.8333 10.7481 12.0125 11.5484 11 11.5484Z"
                    fill="white"
                  />
                </svg>
                <div
                  v-for="venue in poolItem.venues"
                  :key="venue._id"
                  class="pool-ref-item tags"
                >
                  <NuxtLink :to="getItemRoute(venue)" class="pool-ref-link">
                    <h4 class="tag">{{ venue.title }}</h4>
                  </NuxtLink>
                </div>
              </div>
            </section>

            <PoolSocialLinks
              :socials="poolItem.socials"
              :contact="poolItem.contact"
              :contact-href="contactLink"
            />
          </div>

          <section v-if="poolItem?.description" class="pool-description">
            <RichText
              v-if="
                poolItem.description &&
                (poolItem.description[0]?.value ||
                  poolItem.description[1]?.value)
              "
              :blocks="parseI18nObj(poolItem?.description)"
            />
            <RichText
              v-else-if="poolItem.description && poolItem.description[0]?.value"
              :blocks="parseI18nObj(poolItem.description[0].value)"
            />
            <RichText
              v-else-if="poolItem.description && poolItem.description[1]?.value"
              :blocks="parseI18nObj(poolItem.description[1].value)"
            />
          </section>
        </div>
      </div>
    </div>

    <!-- Rechte Seite: nur Bild -->
    <div class="pool-media-wrap" :style="poolDetailsStyle">
      <div class="pool-media">
          <MediaImage :image="itemImage" :alt="itemTitle" class="pool-image" />
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.pool-intro {
  --detail-chip-size: calc(
    var(--small-font-size) + var(--small-padding) * 2 + 0.2rem
  );

  width: var(--page-max-width);
  margin: var(--big-margin) auto 0;
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: flex-start;
  position: relative;
  border: 0.0625rem solid var(--color-text);
  border-radius: 1.5625rem;

  @media screen and (max-width: 900px) {
    flex-flow: column wrap;
    overflow: hidden;
  }

  .pool-intro-content {
    max-width: calc(var(--page-max-width) / 2.5);
    display: flex;
    flex-flow: column wrap;
    justify-content: flex-start;
    align-items: stretch;
    position: relative;
    width: 100%;
    height: 100%;
    border-right: 0.0625rem solid var(--color-text);
    overflow: hidden;

    @media screen and (min-width: 901px) {
      flex: 0 0 calc(var(--page-max-width) / 2.5);
      width: calc(var(--page-max-width) / 2.5);
      max-width: calc(var(--page-max-width) / 2.5);
      aspect-ratio: 4 / 5;
      min-height: calc((var(--page-max-width) / 2.5) * 5 / 4);
    }

    @media screen and (max-width: 900px) {
      max-width: 100%;
      border-right: none;
    }

    .pool-container {
      display: flex;
      flex-flow: column wrap;
      justify-content: flex-start;
      align-items: stretch;
      width: 100%;
      height: 100%;
      min-height: 0;
      flex: 1;
    }

    .pool-info {
      left: 0;
      margin: 0;
      width: 100%;
      background-color: var(--color-bg);
      display: flex;
      flex-flow: row wrap;
      justify-content: flex-start;
      align-items: center;
      flex-grow: 0;
      flex-shrink: 0;
      gap: var(--mid-margin);
      padding: var(--mid-padding);
      border-bottom: 0.0625rem solid var(--color-text);
      shape-rendering: crispEdges;
      z-index: 10;
      border-top-left-radius: 1.5625rem;
      border-top-right-radius: 1.5625rem;

      &-container {
        display: flex;
        flex-flow: column wrap;
        justify-content: center;
        gap: var(--mid-padding);
        width: 100%;
      }
    }

    .pool-details-inner {
      position: relative;
      display: flex;
      flex-flow: column;
      justify-content: flex-start;
      align-items: flex-start;
      overflow: scroll;
	  max-height:66vh;
      flex: 1;
      min-height: 0;
      width: 100%;
      padding: var(--base-margin) var(--big-margin) var(--big-margin);
      gap: var(--base-padding) 0;
      border-right: none;

      @media screen and (max-width: 900px) {
        padding: var(--base-margin) var(--base-margin) var(--big-margin);
      }

      section {
        width: 100%;

        h2,
        h3,
        h4 {
          margin: 0 0 var(--base-padding) 0;
          text-transform: uppercase;
          font-family: var(--font-text-semibold);
          font-size: var(--base-font-size);
          font-weight: 500;
        }
      }

      .pool-header {
        width: 100%;
        display: flex;
        flex-flow: column;
        gap: var(--small-margin);

        .pool-title {
          width: 100%;
          font-size: var(--h1-size);
          text-transform: uppercase;

          a {
            width: max-content;
            cursor: pointer;
          }

          div {
            width: 100%;
            display: flex;
            flex-flow: row wrap;
            justify-content: flex-start;
          }
        }

        .pool__artist {
          font-size: var(--base-font-size);
          font-family: var(--font-text-semibold);
          font-weight: 500;
          text-transform: uppercase;

          a,
          &a {
            cursor: pointer;
          }
        }

        .pool-tags {
          width: 100%;
          display: flex;
          flex-flow: row wrap;
          justify-content: flex-start;
          gap: var(--base-padding);
          margin-bottom: var(--big-margin);

		  .tag {
			background-color: var(--color-blue);
			border-color: var(--color-blue);
		  }
        }
      }

      .pool-meta-bottom {
        display: flex;
        flex-flow: column;
        align-items: flex-start;
        gap: var(--big-padding);
        width: 100%;
      }

      .pool-references-section {
        display: flex;
        flex-flow: row wrap;
        align-items: center;
        width: 100%;
        margin: 0;
      }

      .pool-refs-list {
        display: flex;
        flex-flow: row wrap;
        align-items: center;
        gap: var(--base-padding);
        width: 100%;

        .detail-ref-icon {
          width: var(--detail-chip-size);
          height: var(--detail-chip-size);
          flex-shrink: 0;
        }

        .pool-ref-item {
          display: flex;
          align-items: center;
        }

        .pool-ref-link {
          display: block;
          text-decoration: none;
          color: inherit;
        }

        .pool-ref-info {
          display: flex;
          flex-flow: row wrap;
          align-items: center;
          gap: var(--base-padding);
        }

        h4.tag {
          margin: 0;
          font-size: var(--small-font-size);
          background-color: var(--color-grey);
          color: var(--color-black);
          border-color: var(--color-grey);

          &:hover {
            @media (min-width: 1024px) {
              background-color: var(--color-blue);
              border-color: var(--color-blue);
              color: var(--color-white);
            }
          }
        }
      }

      .pool-description {
        :deep(p),
        :deep(.rich-text p) {
          line-height: 1.5;
        }
      }
    }
  }

  .pool-media-wrap {
    position: relative;
    display: flex;
    flex-flow: column;
    justify-content: flex-start;
    align-items: stretch;
    overflow: hidden;
    width: calc(100% - calc(var(--page-max-width) / 2.5));
	overflow: hidden;

    @media screen and (max-width: 900px) {
      max-width: 100%;
      width: 100%;
      border-bottom-left-radius: 1.5625rem;
      border-bottom-right-radius: 1.5625rem;
      overflow: hidden;
    }

    .pool-media {
      order: 2;
      width: 100%;
      height: 100%;
      max-width: 100%;
      object-fit: cover;
      overflow: hidden;
      border-bottom-right-radius: 1.5625rem;

      @media screen and (max-width: 900px) {
        max-width: 100%;
        max-height: 100%;
        border-bottom-right-radius: 1.5625rem;
        border-bottom-left-radius: 1.5625rem;
      }

      @media screen and (min-width: 900px) {
        min-width: calc(var(--page-max-width) / 2.5);
      }

      .grid-item__link {
        display: block;
        width: 100%;
        height: 100%;
      }

      .pool-image,
      :deep(img) {
        width: 100%;
        aspect-ratio: 1 / 1;
        object-fit: cover;
        background-color: var(--color-grey);
        min-height: 100%;
		min-width: 100%;
		border-top-right-radius: 1.5625rem;

        @media screen and (max-width: 900px) {
          max-width: 100%;
          max-height: 100%;
          border-top-right-radius: 0;
          border-top-left-radius: 0;
          border-bottom-left-radius: 1.5625rem;
          border-bottom-right-radius: 1.5625rem;
        }
      }
    }
  }
}
</style>
