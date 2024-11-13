import {TagIcon, SearchIcon, StarIcon, TextIcon, EyeOpenIcon} from '@sanity/icons'
import {validateSlug} from '@/utils/validateSlug'

export const tagGlobal = {
  name: 'tag.global',
  type: 'document',
  title: 'Global Tag',
  icon: TagIcon,
  groups: [
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
    },
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
