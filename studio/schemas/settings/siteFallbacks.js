import {UnarchiveIcon, DesktopIcon, SearchIcon} from '@sanity/icons'

const TITLE = 'Fallbacks'

export const siteFallbacks = {
  name: 'fallback.global',
  type: 'document',
  title: TITLE,
  icon: UnarchiveIcon,
  groups: [
    {
      title: 'Content',
      name: 'content',
      icon: UnarchiveIcon,
      default: true,
    },
    {
      title: 'SEO',
      name: 'seo',
      icon: SearchIcon,
    },
  ],
  fields: [
    {
      title: 'Fallback Content for single Person',
      name: 'fallbackPerson',
      type: 'fallback.content',
      group: 'content',
      options: {
        collapsible: true,
        collapsed: true,
      },
    },
    {
      title: 'Fallback Content for single Article',
      name: 'fallbackArticle',
      type: 'fallback.content',
      group: 'content',
      options: {
        collapsible: true,
        collapsed: true,
      },
    },
    {
      title: 'Fallback Content for single Set',
      name: 'fallbackSet',
      type: 'fallback.content',
      group: 'content',
      options: {
        collapsible: true,
        collapsed: true,
      },
    },
    {
      title: 'Fallback Content for single Show',
      name: 'fallbackShow',
      type: 'fallback.content',
      group: 'content',
      options: {
        collapsible: true,
        collapsed: true,
      },
    },
    {
      title: 'Fallback Content for single Venue',
      name: 'fallbackVenue',
      type: 'fallback.content',
      group: 'content',
      options: {
        collapsible: true,
        collapsed: true,
      },
    },
    {
      title: 'Fallback SEO for single Person',
      name: 'seoPerson',
      type: 'seo.singletons',
      options: {
        collapsible: true,
        collapsed: true,
      },
      group: 'seo',
    },
    {
      title: 'Fallback SEO for single Article',
      name: 'seoArticle',
      type: 'seo.singletons',
      options: {
        collapsible: true,
        collapsed: true,
      },
      group: 'seo',
    },
    {
      title: 'Fallback SEO for single Set',
      name: 'seoSet',
      type: 'seo.singletons',
      options: {
        collapsible: true,
        collapsed: true,
      },
      group: 'seo',
    },
    {
      title: 'Fallback SEO for single Show',
      name: 'seoShows',
      type: 'seo.singletons',
      options: {
        collapsible: true,
        collapsed: true,
      },
      group: 'seo',
    },
    {
      title: 'Fallback SEO for single Venue',
      name: 'seoVenue',
      type: 'seo.singletons',
      options: {
        collapsible: true,
        collapsed: true,
      },
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
