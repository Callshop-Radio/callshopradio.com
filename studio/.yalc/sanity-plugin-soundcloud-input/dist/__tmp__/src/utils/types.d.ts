import type { ObjectInputProps } from 'sanity';
export interface Config {
    /**
     * Pass SoundCloud Access Tokens
     **/
    clientId: string | undefined;
    clientSecret: string | undefined;
}
export interface Track {
    id: string;
    title: string;
    duration: number;
    artwork_url?: string;
    permalink_url?: string;
}
export type SoundCloudFieldInput = ObjectInputProps;
