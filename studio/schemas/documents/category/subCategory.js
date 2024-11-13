import {HighlightIcon, SearchIcon, StarIcon, TextIcon, EyeOpenIcon} from '@sanity/icons'
import {validateSlug} from '@/utils/validateSlug'

export const subCategory = {
  name: 'category.sub',
  type: 'document',
  title: 'Sub Category',
  icon: HighlightIcon,
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
