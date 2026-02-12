import {useMemo} from 'react'
import {useClient} from 'sanity'

export function useSanityClient() {
  const client = useClient({apiVersion: '2024-01-01'})
  return useMemo(() => client.withConfig({apiVersion: '2024-01-01'}), [client])
}

export const slugify = (input: unknown): string => {
  return input
    .toString()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s+\+]/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .slice(0, 200)
}

export const getDurationString = (duration: number | undefined): string => {
  const minutes = duration
    ? Math.floor(duration / 60)
        .toString()
        .padStart(2, '0')
    : '00'
  const seconds = duration
    ? Math.floor(duration % 60)
        .toString()
        .padStart(2, '0')
    : '00'
  return duration ? `${minutes}:${seconds}` : ''
}
