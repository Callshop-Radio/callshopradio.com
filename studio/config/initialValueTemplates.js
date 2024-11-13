import {LOCKED_DOCUMENT_TYPES} from '@/utils/constants'

/*
Return all templates except the locked documents
*/
export const initialValueTemplates = (prev) => {
  return [
    ...prev.filter((el) => {
      return !LOCKED_DOCUMENT_TYPES.includes(el.schemaType)
    }),
  ]
}
