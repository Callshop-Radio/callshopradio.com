import {defineType} from 'sanity'

export const seoPage = defineType({
  name: 'seo.page',
  title: 'SEO',
  type: 'object',
  fields: [
    {
      title: 'Title',
      name: 'title',
      type: 'placeholderString',
      options: {field: 'title'},
      validation: (Rule) =>
        Rule.max(50).warning('Longer titles may be truncated by search engines'),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: "If empty, displays the settings' SEO description field",
      rows: 2,
      validation: (Rule) =>
        Rule.max(150).warning('Longer descriptions may be truncated by search engines'),
    },
    {
      name: 'image',
      description: "If empty, displays the settings' SEO image field",
      title: 'Image',
      type: 'image',
    },
  ],
})
