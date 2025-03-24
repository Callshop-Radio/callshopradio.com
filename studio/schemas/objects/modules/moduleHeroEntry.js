import {ClipboardIcon, TextIcon, CogIcon} from '@sanity/icons'
import {of} from 'rxjs'

export const moduleHeroEntry = {
  title: 'Hero Entry',
  name: 'module.heroEntry',
  type: 'object',
  icon: ClipboardIcon,
  groups: [],
  fields: [
    {
      title: 'Content Type',
      name: 'type',
      type: 'string',
      initialValue: 'page',
      options: {
        list: [
          {
            title: 'Page Content',
            value: 'page',
          },
          {
            title: 'Custom Content',
            value: 'custom',
          },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      title: 'Heading',
      name: 'title',
      type: 'string',
      hidden: ({parent}) => parent?.type !== 'custom',
    },
    {
      title: 'Text',
      name: 'text',
      type: 'richText',
      hidden: ({parent}) => parent?.type !== 'custom',
    },
    {
      title: 'Link',
      description: 'optional',
      name: 'link',
      type: 'optionalLink',
      hidden: ({parent}) => parent?.type !== 'custom',
    },
    {
      name: 'contentReference',
      type: 'reference',
      description: 'Choose content from Person, Venue, Show, Set or Single Article (Words).',
      title: 'Content',
      to: [{type: 'person'}, {type: 'venue'}, {type: 'show'}, {type: 'set'}, {type: 'article'}],
      options: {
        disableNew: true,
      },
      hidden: ({parent}) => parent?.type !== 'page',
    },
  ],
  preview: {
    select: {
      layout: 'layout',
      type: 'contentReference.title',
    },
    prepare(selection) {
      const {layout, type} = selection

      return {
        title: 'Hero Entry',
        subtitle: type
          ? "Content: '" +
            type.charAt(0).toUpperCase() +
            type.slice(1) +
            "' "
          : 'Empty Hero Slider',
      }
    },
  },
}
