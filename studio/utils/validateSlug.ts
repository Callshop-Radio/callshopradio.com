import slug from 'slug'

const MAX_LENGTH = 96

export const validateSlug = (Rule: {required: () => {custom: (fn: (value: {current?: string}) => Promise<true | string>) => unknown}}) => {
  return Rule.required().custom(async (value: {current?: string}) => {
    const currentSlug = value && value.current
    if (!currentSlug) {
      return true
    }
    if (currentSlug.length >= MAX_LENGTH) {
      return `Must be less than ${MAX_LENGTH} characters`
    }
    if (currentSlug !== slug(currentSlug, {lower: true})) {
      return 'Must be a valid slug'
    }
    return true
  })
}
