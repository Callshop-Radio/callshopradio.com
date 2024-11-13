import {TextIcon} from '@sanity/icons'
export const moduleText = {
  title: 'Text',
  name: 'module.text',
  type: 'object',
  icon: TextIcon,
  fields: [
    {
      name: 'text',
      title: 'Text',
      type: 'richText',
    },
    {
      title: 'Animations',
      name: 'animations',
      type: 'animations.module',
    },
  ],
  preview: {
    select: {
      text: 'text',
    },
    prepare(selection) {
      const text = (selection.text || []).find((block) => block._type === 'block')
      return {
        title: 'Text ',
        subtitle: text
          ? text.children
              .filter((child) => child._type === 'span')
              .map((span) => span.text)
              .join('')
          : undefined,
      }
    },
  },
}
