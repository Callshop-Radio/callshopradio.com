import React from 'react';
export interface Track {
    id: number;
    title: string;
    release_date?: string;
}
export interface SoundcloudData {
    _type: 'soundcloud';
    tracks: Track[];
}
interface DataFetcherProps {
    clientId: string;
    clientSecret: string;
    userId: string;
    websiteURI: string;
    onSuccess: (data: SoundcloudData) => void;
}
declare const DataFetcher: React.FC<DataFetcherProps>;
export default DataFetcher;
