import {TagIcon, SearchIcon, StarIcon, TextIcon, EyeOpenIcon} from '@sanity/icons'
import {validateSlug} from '@/utils/validateSlug'

export const tagVenue = {
  name: 'tag.venue',
  type: 'document',
  title: 'Venue Tag',
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
    {
      title: 'Short',
      name: 'short',
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
