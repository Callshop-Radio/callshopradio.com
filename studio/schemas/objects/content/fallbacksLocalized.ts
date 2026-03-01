import {defineType} from 'sanity'

export const fallbackContentLocalized = defineType({
  name: 'fallback.contentLocalized',
  title: 'Content',
  description: 'Default Text and Images displayed in the frontend if content is missing',
  type: 'object',
  validation: (Rule) => Rule.required(),
  fields: [
    {
      title: 'Headline',
      name: 'title',
      type: 'internationalizedArrayString',
    },
    {
      name: 'description',
      title: 'Description Text',
      type: 'internationalizedArrayRichText',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
    },
  ],
})
