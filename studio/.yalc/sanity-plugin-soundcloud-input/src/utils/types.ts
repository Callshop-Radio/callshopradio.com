// @ts-nocheck
import type {ObjectInputProps} from 'sanity'

export interface Config {
  /**
   * Pass SoundCloud Access Tokens
   **/
  clientId: string | undefined
  clientSecret: string | undefined
}

// Typ für einzelne Tracks von SoundCloud
export interface Track {
  id: string; // Konsistenz: IDs als string
  title: string;
  duration: number;
  artwork_url?: string;
  permalink_url?: string;
}

export type SoundCloudFieldInput = ObjectInputProps
