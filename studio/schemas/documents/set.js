import {
  PlayIcon,
  StarIcon,
  TagIcon,
  DocumentTextIcon,
  SearchIcon,
  TextIcon,
  CogIcon,
  UploadIcon,
} from '@sanity/icons'

import {validateSlug} from '@/utils/validateSlug'

export const set = {
  name: 'set',
  type: 'document',
  title: 'Set',
  icon: PlayIcon,
  groups: [
    {
      title: 'Editorial',
      name: 'editorial',
      icon: TextIcon,
    },
    {
      title: 'SoundCloud',
      name: 'soundcloud',
      icon: UploadIcon,
    },
    {
      title: 'Pool',
      name: 'pool',
      icon: StarIcon,
    },
    {
      title: 'Tags',
      name: 'tags',
      icon: TagIcon,
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
      validation: (Rule) => Rule.required(),
    },
    {
      title: 'Clickable Show Title (→ Link to show)',
      name: 'clickableTitle',
      type: 'boolean',
      initialValue: true,
      group: 'settings',
      options: {layout: 'checkbox'},
    },
    {
      name: 'slug',
      type: 'slug',
      title: 'Slug',
      description: 'callshopradio.com/show/slug',
      options: {source: 'title'},
      validation: validateSlug,
      group: 'editorial',
    },
    {
      title: 'Additional Title',
      description: 'In Case of special editions, features or versions.',
      name: 'additionalTitle',
      type: 'string',
      group: 'editorial',
    },
    {
      title: 'Artwork',
      name: 'image',
      type: 'image',
      group: 'editorial',
    },
    {
      name: 'soundcloud',
      type: 'soundcloud', // Use the custom type from the plugin here
      title: 'SoundCloud Content',
      group: 'soundcloud',
    },
    {
      title: 'About this Episode',
      name: 'content',
      type: 'richTextMedia',
      group: 'editorial',
    },
    {
      name: 'persons',
      title: 'Persons',
      type: 'array',
      group: 'pool',
      of: [
        {
          name: 'person',
          type: 'reference',
          title: 'Person',
          to: [{type: 'person'}],
        },
      ],
    },
    {
      name: 'venues',
      title: 'Venue',
      type: 'array',
      group: 'pool',
      of: [
        {
          name: 'venue',
          type: 'reference',
          title: 'Venue',
          to: [{type: 'venue'}],
        },
      ],
    },
    {
      title: 'Tracklist by single Track',
      name: 'tracklistSingleTrack',
      type: 'boolean',
      initialValue: true,
      group: 'settings',
    },
    {
      name: 'tracklist',
      title: 'Tracklist (Single Tracks)',
      description: 'Add single tracks.',
      type: 'array',
      group: 'editorial',
      of: [
        {
          name: 'track',
          type: 'string',
          title: 'Track',
        },
      ],
      hidden: ({parent}) => parent?.tracklistSingleTrack !== true,
    },
    {
      name: 'tracklistRich',
      title: 'Tracklist',
      description: 'Paste a full tracklist from a textfile.',
      type: 'richText',
      group: 'editorial',
      hidden: ({parent}) => parent?.tracklistSingleTrack !== false,
    },
    {
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'tags',
      of: [
        {
          name: 'tag',
          type: 'reference',
          title: 'Tag',
          to: [{type: 'tag.global'}, {type: 'tag.subGenre'}, {type: 'tag.city'}],
        },
      ],
    },
    {
      name: 'datetime',
      type: 'datetime',
      title: 'Date',
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
      subtitle: 'additionalTitle',
    },
    prepare(selection) {
      const {title, subtitle} = selection
      return {
        title: title ? title : 'No Title',
        subtitle: subtitle ? subtitle : '',
      }
    },
  },
}
