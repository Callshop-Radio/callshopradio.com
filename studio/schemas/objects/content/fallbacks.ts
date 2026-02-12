import {defineType} from 'sanity'

export const fallbackContent = defineType({
  name: 'fallback.content',
  title: 'Content',
  description: 'Default Text and Images displayed in the frontend if content is missing',
  type: 'object',
  validation: (Rule) => Rule.required(),
  fields: [
    {
      title: 'Headline',
      name: 'title',
      type: 'string',
    },
    {
      name: 'description',
      title: 'Description Text',
      type: 'richText',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
    },
  ],
})
