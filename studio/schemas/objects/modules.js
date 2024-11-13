import {DashboardIcon} from '@sanity/icons'

export const modules = {
  title: 'Modules',
  name: 'modules',
  type: 'array',
  icon: DashboardIcon,
  of: [
    {
      type: 'module.contentReferenceGrid',
    },
    {
      type: 'module.contentReferenceSlider',
    },
    {
      type: 'module.heroEntry',
    },
    {
      type: 'module.heroSlider',
    },
    {
      type: 'module.text',
    },
    {
      type: 'module.media',
    },
    {
      type: 'module.mediaPlayer',
    },
  ],
}
