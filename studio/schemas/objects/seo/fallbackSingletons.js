export const seoFallbackSingletons = {
  name: 'seo.singletons',
  title: 'SEO',
  description: 'Default SEO used as a fallback if no page-specific SEO is provided.',
  type: 'object',
  validation: (Rule) => Rule.required(),
  fields: [
    {
      title: 'Title',
      name: 'title',
      type: 'string',
      validation: (Rule) =>
        Rule.max(50).warning('Longer titles may be truncated by search engines'),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 2,
      validation: (Rule) =>
        Rule.max(150).warning('Longer descriptions may be truncated by search engines'),
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
    },
  ],
}
