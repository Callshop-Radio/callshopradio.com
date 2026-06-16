import { InlineIcon } from "@sanity/icons";
import { defineType } from "sanity";

export const moduleCarousel = defineType({
  title: "Carousel",
  name: "module.carousel",
  type: "object",
  icon: InlineIcon,
  fields: [
    {
      name: "slides",
      title: "Slides",
      type: "array",
      of: [{ type: "slide" }],
    },
  ],
  preview: {
    select: {
      slides: "slides",
    },
    prepare(selection) {
      const { slides } = selection;
      return {
        title: "Carousel",
        subtitle: `${slides?.length ?? 0} slide${slides?.length === 1 ? "" : "s"}`,
      };
    },
  },
});
