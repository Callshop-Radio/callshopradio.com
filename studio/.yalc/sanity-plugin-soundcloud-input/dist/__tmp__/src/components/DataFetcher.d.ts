import React from 'react';
interface Track {
    id: number;
    title: string;
}
interface DataFetcherProps {
    clientId: string;
    clientSecret: string;
    onSuccess: (selectedTracks: Track[]) => void;
}
declare const DataFetcher: React.FC<DataFetcherProps>;
export default DataFetcher;
