import {DocumentTextIcon, SearchIcon, TextIcon, CogIcon} from '@sanity/icons'

import {validateSlug} from '@/utils/validateSlug'

export const page = {
  name: 'page',
  type: 'document',
  title: 'Page',
  icon: DocumentTextIcon,
  groups: [
    {
      title: 'Editorial',
      name: 'editorial',
      icon: TextIcon,
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
      title: 'Title',
      name: 'title',
      type: 'string',
      group: 'editorial',
    },
    {
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: validateSlug,
      group: 'editorial',
    },
    {
      title: 'Content',
      name: 'content',
      type: 'internationalizedArrayRichTextMedia',
      group: 'editorial',
    },
    {
      title: 'Modules',
      name: 'modules',
      type: 'modules',
      group: 'editorial',
    },
    {
      title: 'SEO',
      name: 'seo',
      type: 'seo.page',
      group: 'seo',
    },
    // {
    //   title: 'Animations',
    //   name: 'animations',
    //   type: 'animations.page',
    //   group: 'settings',
    // },
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare(selection) {
      const {title} = selection
      return {
        title: title,
      }
    },
  },
}
