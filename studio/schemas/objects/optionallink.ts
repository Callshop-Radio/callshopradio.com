import {LinkIcon} from '@sanity/icons'
import {defineType} from 'sanity'

import {PAGE_REFERENCES} from '@/utils/constants'

export const optionalLink = defineType({
  title: 'Link',
  name: 'optionalLink',
  type: 'object',
  icon: LinkIcon,
  fields: [
    {
      title: 'Type',
      name: 'type',
      type: 'string',
      initialValue: 'none',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Internal', value: 'internal'},
          {title: 'External', value: 'external'},
          {title: 'Function', value: 'function'},
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (Rule) => Rule.required(),
    },
    {
      title: 'Title',
      name: 'title',
      type: 'string',
      description:
        'If empty and internal link, the reference title will be user. For external/function links this field is required.',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (
            (context.parent.type === 'external' || context.parent.type === 'function') &&
            !value
          ) {
            return 'This field is required'
          }
          return true
        }),
      hidden: ({parent}) => parent?.type === 'none',
    },
    {
      name: 'reference',
      type: 'reference',
      weak: true,
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.parent.type === 'internal' && !value) {
            return 'This field is required'
          }
          return true
        }),
      hidden: ({parent}) => parent?.type !== 'internal',
      to: PAGE_REFERENCES,
    },
    {
      name: 'url',
      title: 'URL',
      type: 'url',
      hidden: ({parent}) => parent?.type !== 'external',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.parent.type === 'external' && !value) {
            return 'This field is required'
          }
          return true
        }).uri({scheme: ['http', 'https', 'mailto', 'tel']}),
    },
    {
      title: 'Open in a new window?',
      name: 'blank',
      type: 'boolean',
      hidden: ({parent}) => parent?.type !== 'external',
      initialValue: true,
    },
    {
      name: 'func',
      title: 'Function',
      type: 'linkFunctions',
      hidden: ({parent}) => parent?.type !== 'function',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          if (context.parent.type === 'function' && !value) {
            return 'This field is required'
          }
          return true
        }),
    },
  ],
  preview: {
    select: {
      func: 'func',
      reference: 'reference',
      referenceTitle: 'reference.title',
      referenceType: 'reference._type',
      slug: 'reference.slug.current',
      title: 'title',
      type: 'type',
      url: 'url',
    },
    prepare(selection) {
      const {func, reference, referenceTitle, referenceType, slug, title, type, url} = selection

      let baseUrl = '/'
      const subtitle: string[] = []

      if (type === 'internal') {
        if (referenceType !== 'home' && referenceType !== 'page') {
          baseUrl += `${referenceType}`
        }
        if (slug) {
          baseUrl += `${slug}`
        }
        if (reference) {
          subtitle.push(`→ ${baseUrl || referenceType || reference?._id}`)
        } else {
          subtitle.push('(Nonexistent document reference)')
        }
      } else if (type === 'external') {
        if (url) {
          subtitle.push(`→ ${url}`)
        }
      } else {
        subtitle.push(`→ ${func}`)
      }
      return {
        title: title ?? referenceTitle,
        subtitle: subtitle.join(' '),
      }
    },
  },
})
