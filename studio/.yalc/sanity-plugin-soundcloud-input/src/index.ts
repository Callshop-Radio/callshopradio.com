import { definePlugin, defineType } from 'sanity';
import { soundcloudInputRendering } from './plugin'; // Import rendering logic for the input field
import { soundcloud } from './schema'; // Import the soundcloud schema
import type { Config } from './utils/types';

// Default configuration for SoundCloud plugin
const defaultConfig: Config = {
  clientId: '',
  clientSecret: '',
};

// Define and export the main plugin
export const soundcloudInput = definePlugin<Config | void>((userConfig) => {
  // Merge user-provided config with default config
  const config = { ...defaultConfig, ...userConfig };

  // Validate configuration (e.g., ensure clientId and clientSecret are provided)
  if (!config.clientId || !config.clientSecret) {
    console.warn(
      'SoundCloud Plugin: Missing clientId or clientSecret. Make sure to pass them in the configuration.'
    );
  }

  return {
    name: 'sanity-plugin-soundcloud-input',
    schema: {
      types: [
        // Define the custom "soundcloud" schema type
        defineType({
          title: 'SoundCloud Set',
          name: 'soundcloud', // Type name used in schemas
          type: 'object',
          components: soundcloudInputRendering(config), // Use the custom input rendering function
          fields: [
            {
              title: 'Selected Tracks',
              name: 'tracks',
              type: 'array',
              of: [
                {
                  type: 'object',
                  fields: [
                    {name: 'id', title: 'Track ID', type: 'number'},
                    {name: 'created_at', title: 'Created At', type: 'datetime'},
                    {name: 'duration', title: 'Duration', type: 'number'},
                    {name: 'commentable', title: 'Commentable', type: 'boolean'},
                    {name: 'comment_count', title: 'Comment Count', type: 'number'},
                    {name: 'sharing', title: 'Sharing', type: 'string'},
                    {name: 'tag_list', title: 'Tag List', type: 'string'},
                    {name: 'streamable', title: 'Streamable', type: 'boolean'},
                    {name: 'embeddable_by', title: 'Embeddable By', type: 'string'},
                    {name: 'purchase_url', title: 'Purchase URL', type: 'url'},
                    {name: 'genre', title: 'Genre', type: 'string'},
                    {name: 'title', title: 'Title', type: 'string'},
                    {name: 'description', title: 'Description', type: 'text'},
                    {name: 'label_name', title: 'Label Name', type: 'string'},
                    {name: 'release_year', title: 'Release Year', type: 'number'},
                    {name: 'release_month', title: 'Release Month', type: 'number'},
                    {name: 'release_day', title: 'Release Day', type: 'number'},
                    {name: 'license', title: 'License', type: 'string'},
                    {name: 'uri', title: 'URI', type: 'url'},
                    {
                      name: 'user',
                      title: 'User',
                      type: 'object',
                      fields: [
                        {name: 'id', title: 'User ID', type: 'number'},
                        {name: 'username', title: 'Username', type: 'string'},
                        {name: 'permalink_url', title: 'Permalink URL', type: 'url'},
                        {name: 'avatar_url', title: 'Avatar URL', type: 'url'},
                        {name: 'created_at', title: 'Created At', type: 'datetime'},
                        {name: 'track_count', title: 'Track Count', type: 'number'},
                        {name: 'followers_count', title: 'Followers Count', type: 'number'},
                        {name: 'followings_count', title: 'Followings Count', type: 'number'},
                        {name: 'plan', title: 'Plan', type: 'string'},
                      ],
                    },
                    {name: 'artwork_url', title: 'Artwork URL', type: 'url'},
                    {name: 'stream_url', title: 'Stream URL', type: 'url'},
                    {name: 'playback_count', title: 'Playback Count', type: 'number'},
                    {name: 'favoritings_count', title: 'Favoritings Count', type: 'number'},
                    {name: 'reposts_count', title: 'Reposts Count', type: 'number'},
                    {name: 'downloadable', title: 'Downloadable', type: 'boolean'},
                  ],
                },
              ],
            },
          ],
        }),
      ],
    },
  };
});