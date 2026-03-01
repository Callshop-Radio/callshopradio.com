import {UlistIcon, SearchIcon, TextIcon, CogIcon} from '@sanity/icons'
import { defineType } from 'sanity'

const TITLE = 'Pool'

export const pool = defineType({
  name: 'pool',
  type: 'document',
  title: TITLE,
  icon: UlistIcon,
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
      title: 'Intro Slider',
      name: 'slider',
      type: 'object',
      group: 'editorial',
      fields: [
        {
          title: 'Number of visible Pool Profiles',
          name: 'count',
          type: 'number',
          initialValue: 6,
          options: {
            list: [
              {value: 2, title: '2'},
              {value: 4, title: '4'},
              {value: 6, title: '6'},
              {value: 8, title: '8'},
              {value: 10, title: '10'},
            ],
            layout: 'radio',
            direction: 'horizontal',
          },
          validate: (Rule) => Rule.required().integer().min(2).max(10),
        },
        {
          title: 'Auto load content',
          description: 'Disable to manually select content.',
          name: 'autoLoad',
          type: 'boolean',
          initialValue: true,
          options: {
            layout: 'checkbox',
          },
          validation: (Rule) => Rule.required(),
        },
        {
          name: 'profiles',
          title: 'Profiles',
          description: 'Only selected content below will be displayed.',
          type: 'array',
          validate: (Rule) => Rule.integer().min(2).max(10),
          hidden: ({parent}) => parent?.autoLoad !== false,
          of: [
            {
              name: 'set',
              type: 'reference',
              title: 'Set',
              to: [{type: 'person'}, {type: 'venue'}],
              options: {
                disableNew: true,
              },
            },
          ],
        },
      ],
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
    {
      name: 'color',
      title: 'Page Color',
      type: 'color',
      group: 'settings',
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