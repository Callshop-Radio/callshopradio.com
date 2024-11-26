// @ts-nocheck
import React from 'react'
import { Card, Inline, Button, Text, TextInput, Stack } from '@sanity/ui'
import DataFetcher from './DataFetcher'
import { TrashIcon } from '@sanity/icons'
import { unset, set } from 'sanity'

interface Config {
  clientId: string
  clientSecret: string
}

interface InputProps {
  config: Config
  onChange: (value: any) => void
  value: any
}

export const SoundCloudInputField: React.FC<InputProps> = ({ config, onChange, value }) => {
  const { clientId, clientSecret } = config

  const handleReset = () => {
    onChange(unset())
  }

  const setTrackData = (data) => {
    onChange(data ? set(data) : unset())
  }

  const imgStyle = {
    width: 'auto',
    height: '100px',
    borderRadius: '2px',
  }

  return (
    <Card>
      {!value && (
        <DataFetcher clientId={clientId} clientSecret={clientSecret} onSuccess={setTrackData} />
      )}
      {value && (
        <Stack space={4}>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Track ID
            </Text>
            <TextInput fontSize={2} padding={3} readOnly value={value?.id} />
          </Stack>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Title
            </Text>
            <TextInput fontSize={2} padding={3} readOnly value={value?.title} />
          </Stack>
          <Stack space={3}>
            <Text size={1} weight="semibold">
              Artwork
            </Text>
            {value?.artwork_url && (
              <img
                src={value.artwork_url}
                alt="SoundCloud Track Artwork"
                style={imgStyle}
              />
            )}
          </Stack>
          <Inline space={[2]}>
            <Button
              text="Reset"
              icon={TrashIcon}
              mode="ghost"
              onClick={handleReset}
              type="reset"
              tone="critical"
            />
          </Inline>
        </Stack>
      )}
    </Card>
  )
}
