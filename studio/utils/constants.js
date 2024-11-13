import {documents} from '@/schemas/documents'
import {settings} from '@/schemas/settings'
import {singletons} from '@/schemas/singletons'

const SETTINGS = [...settings.map((schema) => schema.name)]
const SINGLETONS = [...singletons.map((schema) => schema.name)]
const DOCUMENTS = [...documents.map((schema) => schema.name)]

// All schema types which can be used for previews and internal links
const PAGES = [...SINGLETONS, ...DOCUMENTS]

// Document types which cannot be created through `New Document`
export const LOCKED_DOCUMENT_TYPES = [...SINGLETONS, ...SETTINGS, 'media.tag']

// Page references for intenal links
export const PAGE_REFERENCES = PAGES.map((type) => ({
  type,
}))

// Page types with previews
export const PREVIEW_TYPES = [...PAGES]
