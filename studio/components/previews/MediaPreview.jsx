export default function MediaPreview(props) {
  const { isVideo, playbackId } = props;

  const thumbnailUrl = playbackId
    ? `https://image.mux.com/${playbackId}/animated.gif`
    : undefined;

  const media =
    isVideo && thumbnailUrl ? (
      <img
        alt="Video preview"
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          objectFit: "cover",
        }}
        src={thumbnailUrl}
      />
    ) : (
      props.media
    );

  return props.renderDefault({ ...props, media });
}
