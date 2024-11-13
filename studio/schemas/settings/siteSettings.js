import { CogIcon, DesktopIcon, SearchIcon} from '@sanity/icons'

const TITLE = 'Settings'

export const siteSettings = {
  name: 'siteSettings',
  type: 'document',
  title: TITLE,
  icon: CogIcon,
  groups: [
    {
      title: 'Site Settings',
      name: 'site',
      icon: DesktopIcon,
    },
    {
      title: 'Settings',
      name: 'settings',
      icon: CogIcon,
    },
    {
      title: 'SEO',
      name: 'seo',
      icon: SearchIcon,
    },
  ],
  fields: [
    {
      title: 'Site Title',
      name: 'title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: 'site',
    },
    {
      title: 'Favicon',
      name: 'favicon',
      type: 'image',
      group: 'site',
    },
    {
      title: 'Animations Global',
      description: 'Activate to see page animations. Will override all animation settings if disabled.',
      name: 'animations',
      type: 'animations.global',
      group: 'settings',
    },
    {
      title: 'SEO',
      name: 'seo',
      type: 'seo.fallback',
      group: 'seo',
    },
  ],
  preview: {
    prepare() {
      return {
        title: TITLE,
      }
    },
  },
}
