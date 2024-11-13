import {ClipboardIcon, TextIcon, CogIcon} from '@sanity/icons'
import {of} from 'rxjs'

export const moduleHeroEntry = {
  title: 'Hero Entry',
  name: 'module.heroEntry',
  type: 'object',
  icon: ClipboardIcon,
  groups: [
  ],
  fields: [
    {
      title: 'Heading',
      name: 'title',
      type: 'string',
    },
    {
      title: 'Layout',
      name: 'layout',
      type: 'string',
      initialValue: 'image',
      options: {
        list: [
          {
            title: 'Card',
            value: 'card',
          },
          {
            title: 'Large Image',
            value: 'image',
          },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      name: 'contentReference',
      type: 'reference',
      description: 'Choose content from Artist, Venue, Show, Set or Single Article (Words).',
      title: 'Content',
      to: [{type: 'artist'}, {type: 'venue'}, {type: 'show'}, {type: 'set'}, {type: 'article'}],
      options: {
        disableNew: true,
      },
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
        title: 'Content Reference',
        subtitle: type
          ? "To '" +
            type.charAt(0).toUpperCase() +
            type.slice(1) +
            "', displayed as " +
            layout +
            '.'
          : 'Empty',
      }
    },
  },
}
