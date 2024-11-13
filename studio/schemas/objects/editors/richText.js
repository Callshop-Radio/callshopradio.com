// import {styles} from './text/styles'
import {annotations} from './text/annotations'
import {decorators} from './text/decorators'

export const richText = {
  title: 'Editor',
  name: 'richText',
  type: 'array',
  of: [
    {
      type: 'block',
      // styles,
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
}
