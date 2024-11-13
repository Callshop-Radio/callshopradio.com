import {DashboardIcon} from '@sanity/icons'

export const animationsGlobal = {
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
}
