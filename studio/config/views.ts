import {PREVIEW_TYPES} from '@/utils/constants'

const resolveProductionUrl = async ({
  doc,
  context,
}: {
  doc?: {_type: string; _id: string}
  context: {document?: {_type: string; _id: string}; getClient: (opts: {apiVersion: string}) => Promise<{fetch: (query: string, params: {id: string}) => Promise<string | undefined>}>}
}) => {
  const frontendUrl = import.meta.env.SANITY_STUDIO_PREVIEW_URL
  const {getClient} = context

  if (!doc) {
    doc = context.document
  }

  if (doc && PREVIEW_TYPES.includes(doc._type)) {
    const client = await getClient({apiVersion: '2024-01-05'})
    const slug = await client.fetch(`*[_id == $id][0].slug.current`, {id: doc._id})

    const url = new URL(frontendUrl)

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
