import {PresentationIcon} from '@sanity/icons'
import {defineType} from 'sanity'

export const moduleHeroSlider = defineType({
  title: 'Hero Slider',
  name: 'module.heroSlider',
  type: 'object',
  icon: PresentationIcon,
  fields: [
    {
      name: 'slides',
      title: 'Slides',
      type: 'array',
      of: [{type: 'module.heroEntry'}],
    },
  ],
  preview: {
    select: {
      slides: 'slides',
    },
    prepare(selection) {
      const {slides} = selection
      return {
        title: 'Hero Slider',
        subtitle: `${slides?.length ?? 0} slide${slides?.length === 1 ? '' : 's'}`,
      }
    },
  },
})
