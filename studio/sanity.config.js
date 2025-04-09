import {codeInput} from '@sanity/code-input'
import {dashboardTool} from '@sanity/dashboard'
import {visionTool} from '@sanity/vision'
import {defineConfig, isDev} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import {netlifyWidget} from 'sanity-plugin-dashboard-widget-netlify'
import {media} from 'sanity-plugin-media'
import {muxInput} from 'sanity-plugin-mux-input'
import {internationalizedArray} from 'sanity-plugin-internationalized-array'
import {colorInput} from '@sanity/color-input'
import {Logo} from './components/icons/Logo'
import {initialValueTemplates} from './config/initialValueTemplates'
import {structure} from './config/structure'
import {resolveProductionUrl} from './config/views'
import {schemaTypes} from './schemas'

import {soundcloudInput} from '@damianrosellen/sanity-plugin-soundcloud-input'

const devPlugins = [visionTool()]

export default defineConfig({
  name: 'default',
  title: 'Callshop Radio',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID,
  dataset: process.env.SANITY_STUDIO_DATASET,
  token: process.env.SANITY_STUDIO_TOKEN,

  icon: Logo,

  plugins: [
    codeInput(),
    structureTool({
      structure,
    }),
    presentationTool({
      previewUrl: {
        origin: isDev
          ? 'http://localhost:3000'
          : process.env.SANITY_STUDIO_PREVIEW_URL || 'http://localhost:3000',
        // previewMode: {
        //   enable: '/preview/enable',
        //   disable: '/preview/disable',
        // },
      },
    }),
    media(),
    muxInput({mp4_support: 'standard'}),
    soundcloudInput({
      clientId: process.env.SANITY_STUDIO_SOUNDCLOUD_CLIENT_ID,
      clientSecret: process.env.SANITY_STUDIO_SOUNDCLOUD_CLIENT_SECRET,
      userId: process.env.SANITY_STUDIO_SOUNDCLOUD_USER_ID,
    }),
    dashboardTool({
      widgets: [
        netlifyWidget({
          title: 'Netlify deploys',
          sites: [
            {
              title: 'Website (Live)',
              apiId: process.env.SANITY_STUDIO_NETLIFY_API_ID,
              buildHookId: process.env.SANITY_STUDIO_NETLIFY_BUILD_HOOK_ID,
              name: process.env.SANITY_STUDIO_NETLIFY_NAME,
              url: process.env.SANITY_STUDIO_PREVIEW_URL,
            },
          ],
        }),
      ],
    }),
    colorInput(),
    internationalizedArray({
      languages: [
        {id: 'de', title: 'Deutsch'},
        {id: 'en', title: 'English'}
      ],
      defaultLanguages: ['en'],
      fieldTypes: ['string', 'richText', 'richTextMedia'],
      buttonAddAll: false,
      languageDisplay: 'codeOnly'
    }),
    ...(isDev ? devPlugins : []),
  ],

  schema: {
    types: schemaTypes,
    templates: (prev) => initialValueTemplates(prev),
  },

  document: {
    productionUrl: async (_prev, context) =>
      resolveProductionUrl({
        context,
      }),
      newDocumentOptions: (prev, {currentUser, creationContext}) => {
        const {type, schemaType} = creationContext
        if (type === 'structure' && schemaType === 'set') {
          return []
        }
        return prev
      },
  },

  form: {
    // Only use this media browser when selecting image only
    image: {
      assetSources: (previousAssetSources) => {
        return previousAssetSources.filter((assetSource) => {
          return assetSource.name === 'media'
        })
      },
    },
  },
})
