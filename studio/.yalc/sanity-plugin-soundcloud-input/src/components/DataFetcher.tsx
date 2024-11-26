import React, {useState} from 'react'
import {Inline, Text, Button, Stack, Spinner, Select} from '@sanity/ui'

// Definiere den Typ für ein Track-Objekt
interface Track {
  id: number
  title: string
}

// Definiere die Props
interface DataFetcherProps {
  clientId: string
  clientSecret: string
  onSuccess: (selectedTracks: Track[]) => void
}

const DataFetcher: React.FC<DataFetcherProps> = (props) => {
  const { clientId, clientSecret, onSuccess } = props;
  const [isFetching, setIsFetching] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);
  const [cachedAccessToken, setCachedAccessToken] = useState<string | null>(null); // Cache für den Zugriffstoken

  const fetchAccessToken = async (): Promise<string | null> => {
    if (cachedAccessToken) {
      // Wenn ein Zugriffstoken im Cache vorhanden ist, verwende diesen
      return cachedAccessToken;
    }

    const tokenUrl = 'https://api.soundcloud.com/oauth2/token';
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json; charset=utf-8',
        },
        body,
      });

      console.log("Token Response Status:", response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch access token. Error response:", errorText);
        setErrorMsg(`Failed to fetch access token. Status: ${response.status}`);
        return null;
      }

      const data = await response.json();
      console.log("Token Response Data:", data);

      if (data.access_token) {
        setCachedAccessToken(data.access_token); // Speichere den Token im Cache
        return data.access_token;
      } else {
        setErrorMsg(data.error || 'Failed to obtain access token');
        return null;
      }
    } catch (error) {
      console.error('Error fetching access token:', error);
      setErrorMsg('Error obtaining access token');
      return null;
    }
  };

  const fetchUserId = async (username: string): Promise<string | undefined> => {
    const accessToken = await fetchAccessToken();
  
    if (!accessToken) {
      setErrorMsg("Failed to obtain access token");
      return undefined;
    }
  
    try {
      const response = await fetch(`https://api.soundcloud.com/resolve?url=https://soundcloud.com/${username}`, {
        method: 'GET',
        headers: {
          Authorization: `OAuth ${accessToken}`, // Zugriffstoken hinzufügen
        },
      });
  
      if (!response.ok) {
        console.error("Failed to resolve username. Status:", response.status);
        setErrorMsg(`Failed to resolve username. Status: ${response.status}`);
        return undefined;
      }
  
      const data = await response.json();
      console.log("User Data:", data); // Logge die Daten zur Überprüfung
  
      if (data && data.id) {
        return data.id; // Die Benutzer-ID wird zurückgegeben
      } else {
        console.error("User ID not found in response data");
        setErrorMsg('User ID not found in response data');
        return undefined;
      }
    } catch (error) {
      console.error("Error fetching user ID:", error);
      setErrorMsg('Failed to fetch user ID.');
      return undefined;
    }
  };

  const fetchTracks = async () => {
    setIsFetching(true);
    setErrorMsg('');

    const accessToken = await fetchAccessToken();
    if (!accessToken) {
      setIsFetching(false);
      return;
    }

    const userId = await fetchUserId("callshopradio");
    if (!userId) {
      setErrorMsg("User not found");
      setIsFetching(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.soundcloud.com/users/${userId}/tracks?client_id=${clientId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `OAuth ${accessToken}`,
          },
        }
      );

      console.log("Response Status:", response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch user tracks');
      }

      const data = await response.json();
      const transformedTracks = data.map((track: any) => ({
        id: track.id.toString(),
        title: track.title,
        duration: track.duration,
        artwork_url: track.artwork_url,
        permalink_url: track.permalink_url,
      }));

      setTracks(transformedTracks);
    } catch (error) {
      console.error('Error fetching user tracks:', error);
      setErrorMsg('Error fetching user tracks.');
    } finally {
      setIsFetching(false);
    }
  };
  

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, (option) =>
      Number(option.value),
    )
    setSelectedTracks(selectedOptions)
    const selectedTracksData = tracks.filter((track) => selectedOptions.includes(track.id))
    onSuccess(selectedTracksData)
  }

  return (
    <Stack space={4}>
      {(!clientId || !clientSecret) && (
        <Inline space={[2]}>
          <Text size={2}>Missing</Text>
          <Text size={2} style={{fontWeight: 'bold'}}>
            Client ID or Client Secret
          </Text>
        </Inline>
      )}
      {clientId && clientSecret && (
        <>
          <Button text="Fetch Tracks" onClick={fetchTracks} disabled={isFetching} tone="primary" />
          {isFetching && <Spinner muted />}
          {tracks.length > 0 && (
            <Select onChange={handleSelectChange} value={selectedTracks.map(String)} multiple>
              {tracks.map((track) => (
                <option key={track.id} value={track.id.toString()}>
                  {track.title}
                </option>
              ))}
            </Select>
          )}
          {errorMsg && <Text style={{color: 'red'}}>Error: {errorMsg}</Text>}
        </>
      )}
    </Stack>
  )
}

export default DataFetcher
