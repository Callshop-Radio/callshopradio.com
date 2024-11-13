/* eslint-disable react/prop-types */
import React from 'react'

export default function MediaPreview(props) {
  const {isVideo, poster, playbackId, image, ...restProps} = props

  // create thumbnail url
  const thumbnailUrl = playbackId ? `https://image.mux.com/${playbackId}/animated.gif` : undefined

  if (isVideo && thumbnailUrl) {
    // create miniature icon
    restProps.media = (
      // eslint-disable-next-line jsx-a11y/alt-text
      <img
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          objectFit: 'cover',
        }}
        src={thumbnailUrl}
      />
    )
  }

  return props.renderDefault(restProps)
}
