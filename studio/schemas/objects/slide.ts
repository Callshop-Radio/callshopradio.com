import { ImageIcon, PlayIcon } from "@sanity/icons";
import { defineType } from "sanity";

import MediaPreview from "@/components/previews/MediaPreview";
import { getDurationString } from "@/utils/helpers";

export const slide = defineType({
  title: "Slide",
  name: "slide",
  type: "object",
  icon: ImageIcon,
  fields: [
    {
      name: "type",
      title: "Type",
      type: "string",
      initialValue: "image",
      options: {
        list: ["image", "video"],
        layout: "radio",
        direction: "horizontal",
      },
    },
    {
      title: "Video file",
      name: "video",
      type: "mux.video",
      hidden: ({ parent }) => parent?.type !== "video",
      validation: (Rule) =>
        Rule.custom((field, context) => {
          if (context.document.type === "video" && !field) {
            return "Video is required.";
          }
          return true;
        }),
    },
    {
      name: "image",
      title: "Image",
      type: "image",
      description: "Will be the poster image when type is 'video'",
      validation: (Rule) =>
        Rule.custom((field, context) => {
          if (context.document.type === "image" && !field) {
            return "Image is required.";
          }
          return true;
        }),
    },
    {
      name: "videoSettings",
      title: "Video Player Settings",
      type: "object",
      hidden: ({ parent }) => parent?.type !== "video",
      fields: [
        {
          type: "boolean",
          name: "autoplay",
          title: "Autoplay",
          description: "Videos which are autoplay will automatically be muted",
          initialValue: false,
        },
        {
          type: "boolean",
          name: "controls",
          title: "Controls",
          initialValue: true,
        },
      ],
    },
  ],
  components: {
    preview: MediaPreview,
  },
  preview: {
    select: {
      type: "type",
      image: "image",
      poster: "image.asset",
      filename: "image.asset.originalFilename",
      dimensions: "image.asset.metadata.dimensions",
      playbackId: "video.asset.playbackId",
      tracks: "video.asset.data.tracks",
      duration: "video.asset.data.duration",
    },
    prepare(selection) {
      const {
        type,
        image,
        filename,
        dimensions,
        playbackId,
        tracks,
        duration,
        poster,
      } = selection;
      const title = type.charAt(0).toUpperCase() + type.slice(1);
      let subtitle: string | undefined;

      const isVideo = type === "video";

      const durationString = getDurationString(duration);
      const videoTrack = tracks?.find(
        (el: { type: string }) => el.type === "video",
      );
      const videoWidth = videoTrack ? videoTrack.max_width : undefined;
      const videoHeight = videoTrack ? videoTrack.max_height : undefined;

      if (isVideo) {
        subtitle = videoTrack
          ? `${durationString} (${videoWidth}px × ${videoHeight}px)`
          : durationString;
      } else {
        subtitle =
          dimensions && filename
            ? `${filename} (${dimensions?.width}px × ${dimensions?.height}px)`
            : undefined;
      }

      return {
        title: `${title}`,
        subtitle,
        media: isVideo ? PlayIcon : image ? image : ImageIcon,
        poster,
        playbackId,
        image,
        isVideo,
      };
    },
  },
});
