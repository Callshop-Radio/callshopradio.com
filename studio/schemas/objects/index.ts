import { fallbackContent } from "./content/fallbacks";
import { fallbackContentLocalized } from "./content/fallbacksLocalized";
import { richText } from "./editors/richText";
import { richTextMedia } from "./editors/richTextMedia";
import { link } from "./link";
import { linkFunctions } from "./linkFunctions";
import { modules } from "./modules";
import { moduleCarousel } from "./modules/carousel";
import { moduleMedia } from "./modules/media";
import { moduleContentReferenceGrid } from "./modules/moduleContentReferenceGrid";
import { moduleContentReferenceSlider } from "./modules/moduleContentReferenceSlider";
import { moduleHeroEntry } from "./modules/moduleHeroEntry";
import { moduleHeroSlider } from "./modules/moduleHeroSlider";
import { moduleText } from "./modules/text";
import { optionalLink } from "./optionallink";
import { placeholderString } from "./placeholderString";
import { seoFallback } from "./seo/fallback";
import { seoFallbackSingletons } from "./seo/fallbackSingletons";
import { seoPage } from "./seo/page";
import { slide } from "./slide";

export const objects = [
  fallbackContent,
  fallbackContentLocalized,
  richText,
  richTextMedia,
  link,
  optionalLink,
  linkFunctions,
  modules,
  moduleCarousel,
  moduleContentReferenceGrid,
  moduleContentReferenceSlider,
  moduleHeroEntry,
  moduleHeroSlider,
  moduleMedia,
  moduleText,
  placeholderString,
  seoFallback,
  seoFallbackSingletons,
  seoPage,
  slide,
];
