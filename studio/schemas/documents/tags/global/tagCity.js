import {TagIcon, SearchIcon, StarIcon, TextIcon, EyeOpenIcon} from '@sanity/icons'
import {validateSlug} from '@/utils/validateSlug'

export const tagCity = {
  name: 'tag.city',
  type: 'document',
  title: 'City',
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
      type: 'internationalizedArrayString',
    },
    {
      title: 'Short',
      name: 'short',
      type: 'internationalizedArrayString',
    },
  ],
  preview: {
    select: {
      title: 'title.0.value',
      subtitle: 'short.0.value',
    },
    prepare(selection) {
      const {title,subtitle} = selection
      return {
        title: title,
        subtitle: subtitle,
      }
    },
  },
}
