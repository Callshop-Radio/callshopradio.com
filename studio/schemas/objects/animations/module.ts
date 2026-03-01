import {DashboardIcon} from '@sanity/icons'
import {defineType} from 'sanity'

export const animationsModule = defineType({
  title: 'Animations',
  name: 'animations.module',
  type: 'object',
  icon: DashboardIcon,
  fields: [
    {
      title: 'Show Airplane',
      type: 'boolean',
      name: 'logo',
      initialValue: false,
      options: {layout: 'checkbox'},
    },
    {
      title: 'Airplane Size',
      type: 'string',
      name: 'size',
      initialValue: 'small',
      options: {
        list: [
          {title: 'Large', value: 'large'},
          {title: 'Small', value: 'small'}
        ],
        layout: 'radio'
      },
      hidden: ({parent}) => parent?.logo !== true,
    },
    {
      title: 'Animations active',
      type: 'boolean',
      name: 'active',
      initialValue: false,
      options: {layout: 'checkbox'},
    },
  ],
})
