import {TextIcon} from '@sanity/icons'
import {defineType} from 'sanity'

export const moduleText = defineType({
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
  ],
  preview: {
    select: {
      text: 'text',
    },
    prepare(selection) {
      const text = (selection.text || []).find((block: {_type: string}) => block._type === 'block')
      return {
        title: 'Text ',
        subtitle: text
          ? text.children
              .filter((child: {_type: string}) => child._type === 'span')
              .map((span: {text: string}) => span.text)
              .join('')
          : undefined,
      }
    },
  },
})
