import {LOCKED_DOCUMENT_TYPES} from '@/utils/constants'

export const initialValueTemplates = (prev: {schemaType: string}[]) => {
  return [
    ...prev.filter((el) => {
      return !LOCKED_DOCUMENT_TYPES.includes(el.schemaType)
    }),
  ]
}
