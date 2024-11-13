import {PREVIEW_TYPES} from '@/utils/constants'

/*
resolve production url
*/
const resolveProductionUrl = async ({doc, context}) => {
  const frontendUrl = import.meta.env.SANITY_STUDIO_PREVIEW_URL

  const {getClient} = context

  if (!doc) {
    doc = context.document
  }

  if (PREVIEW_TYPES.includes(doc._type)) {
    const client = await getClient({apiVersion: '2024-01-05'})
    const slug = await client.fetch(`*[_id == $id][0].slug.current`, {id: doc._id})

    // Build preview url
    const url = new URL(frontendUrl)

    // Switch for resolving doc type urls
    switch (doc._type) {
      case 'home':
        url.pathname = ``
        break
      case 'page':
        url.pathname = `/${slug}`
        break
      default:
        url.pathname = `/${doc._type}/${slug}`
        break
    }

    return url.toString()
  }

  return ''
}

export {resolveProductionUrl}
