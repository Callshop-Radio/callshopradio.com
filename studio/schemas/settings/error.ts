import {WarningFilledIcon} from '@sanity/icons'
import { defineType } from 'sanity'

const TITLE = 'Error'

export const error = defineType({
  name: 'error',
  type: 'document',
  title: TITLE,
  icon: WarningFilledIcon,

  fields: [
    {
      title: 'Title',
      name: 'title',
      type: 'string',
      initialValue: 'Page not found',
    },
    {
      title: 'Content',
      name: 'content',
      type: 'richText',
    },
    {
      title: 'Button',
      name: 'button',
      type: 'string',
      initialValue: 'Go back',
    },
  ],
  preview: {
    select: {
      slug: 'slug.current',
    },
    prepare({slug}) {
      return {
        title: TITLE,
        subtitle: `/${slug}`,
      }
    },
  },
})