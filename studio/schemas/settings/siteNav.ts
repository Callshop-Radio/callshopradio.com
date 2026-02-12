import {MenuIcon} from '@sanity/icons'
import { defineType } from 'sanity'


const TITLE = 'Navigation'

export const siteNav = defineType({
  name: 'siteNav',
  type: 'document',
  title: TITLE,
  icon: MenuIcon,
  fields: [
    {
      title: 'Main Menu',
      name: 'mainMenu',
      type: 'array',
      of: [
        {
          type: 'link',
        },
      ],
    },
    {
      title: 'Schedule Page',
      name: 'schedulePage',
      type: 'reference',
      weak: true,
      validation: Rule => Rule.required(),
      to: { type: 'timetable'}
    },
    {
      name: 'discordLink',
      title: 'Discord Link',
      type: 'url',
      validation: (Rule) =>
        Rule.uri({scheme: ['http', 'https']}),
    },
    {
      title: 'Foooter Menu',
      name: 'footerMenu',
      type: 'array',
      of: [
        {
          type: 'link',
        },
      ],
    },
  ],
  preview: {
    prepare() {
      return {
        title: TITLE,
      }
    },
  },
})