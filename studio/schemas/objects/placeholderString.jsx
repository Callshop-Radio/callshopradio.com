import React from 'react'

import PlaceholderStringInput from '@/components/inputs/PlaceholderString'

export const placeholderString = {
  name: 'placeholderString',
  title: 'Title',
  type: 'string',
  components: {
    input: PlaceholderStringInput,
  },
  description: (
    <>
      If empty, displays the document title (<code>title</code>)
    </>
  ),
}
