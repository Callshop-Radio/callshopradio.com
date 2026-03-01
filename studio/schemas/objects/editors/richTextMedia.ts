import {defineType} from 'sanity'

import {annotations} from './text/annotations'
import {decorators} from './text/decorators'

export const richTextMedia = defineType({
  title: 'Editor',
  name: 'richTextMedia',
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
    {type: 'module.media'},
    {type: 'module.carousel'},
  ],
})
