import {defineType} from 'sanity'

export const linkFunctions = defineType({
  title: 'Function',
  name: 'linkFunctions',
  type: 'string',
  initialValue: 'cookie',
  options: {
    list: [
      {
        value: 'cookie',
        title: 'Open Cookie Setting',
      },
    ],
  },
})
