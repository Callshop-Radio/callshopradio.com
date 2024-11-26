import {Plugin as Plugin_2} from 'sanity'

declare interface Config {
  /**
   * Pass SoundCloud Access Tokens
   **/
  clientId: string | undefined
  clientSecret: string | undefined
}

export declare const soundcloudInput: Plugin_2<void | Config>

export {}
