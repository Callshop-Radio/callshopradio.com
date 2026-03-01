import {DashboardIcon} from '@sanity/icons'
import {defineType} from 'sanity'

export const animationsGlobal = defineType({
  title: 'Animations',
  name: 'animations.global',
  type: 'object',
  icon: DashboardIcon,
  fields: [
    {
      title: 'Animations active',
      type: 'boolean',
      name: 'active',
      initialValue: true,
      options: {layout: 'checkbox'},
    },
  ],
})
