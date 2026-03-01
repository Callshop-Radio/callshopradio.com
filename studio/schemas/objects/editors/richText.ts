import {defineType} from 'sanity'

import {annotations} from './text/annotations'
import {decorators} from './text/decorators'

export const richText = defineType({
  title: 'Editor',
  name: 'richText',
  type: 'array',
  of: [
    {
      type: 'block',
      lists: [
        {title: 'Bullet', value: 'bullet'},
        {title: 'Number', value: 'number'},
      ],
      marks: {
        decorators,
        annotations,
      },
    },
  ],
})
