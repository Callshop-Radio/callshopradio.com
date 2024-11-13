import {InlineIcon} from '@sanity/icons'

export const moduleCarousel = {
  title: 'Carousel',
  name: 'module.carousel',
  type: 'object',
  icon: InlineIcon,
  fields: [
    {
      name: 'slides',
      title: 'Slides',
      type: 'array',
      of: [
        {
          type: 'slide',
        },
      ],
    },
    // {
    //   title: 'Animations',
    //   name: 'animations',
    //   type: 'animations.module',
    // },
  ],
  preview: {
    select: {
      slides: 'slides',
    },
    prepare(selection) {
      const {slides} = selection

      return {
        title: 'Carousel',
        subtitle: `${slides?.length ?? 0} slide${slides?.length === 1 ? '' : 's'}`,
      }
    },
  },
}
