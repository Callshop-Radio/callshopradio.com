import { documents } from "@/schemas/documents";
import { settings } from "@/schemas/settings";
import { singletons } from "@/schemas/singletons";

const SETTINGS = [...settings.map((schema) => schema.name)];
const SINGLETONS = [...singletons.map((schema) => schema.name)];
const DOCUMENTS = [...documents.map((schema) => schema.name)];

const PAGES = [...SINGLETONS, ...DOCUMENTS];

export const LOCKED_DOCUMENT_TYPES = [...SINGLETONS, ...SETTINGS, "media.tag"];

export const PAGE_REFERENCES = PAGES.map((type) => ({
  type,
}));

export const PREVIEW_TYPES = [...PAGES];
