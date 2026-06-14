import { LinkIcon } from "@sanity/icons";

import { LinkAnnotation } from "@/components/annotations/LinkAnnotation";
import { PAGE_REFERENCES } from "@/utils/constants";

export const annotations = [
  {
    title: "Link",
    name: "link",
    type: "object",
    icon: LinkIcon,
    components: {
      annotation: LinkAnnotation,
    },
    fields: [
      {
        title: "Type",
        name: "type",
        type: "string",
        initialValue: "internal",
        options: {
          list: [
            { title: "Internal", value: "internal" },
            { title: "External", value: "external" },
            { title: "Download", value: "download" },
            { title: "Function", value: "function" },
          ],
          layout: "radio",
          direction: "horizontal",
        },
        validation: (Rule) => Rule.required(),
      },
      {
        title: "Internal Link",
        name: "reference",
        type: "reference",
        to: PAGE_REFERENCES,
        hidden: ({ parent }) => parent?.type !== "internal",
        validation: (Rule) =>
          Rule.custom((value, context) => {
            if (context.parent.type === "internal" && !value) {
              return "This field is required";
            }
            return true;
          }),
      },
      {
        name: "url",
        title: "URL",
        type: "url",
        hidden: ({ parent }) => parent?.type !== "external",
        validation: (Rule) =>
          Rule.custom((value, context) => {
            if (context.parent.type === "external" && !value) {
              return "This field is required";
            }
            return true;
          }).uri({ scheme: ["http", "https", "mailto", "tel"] }),
      },
      {
        title: "Open in a new window?",
        name: "blank",
        type: "boolean",
        hidden: ({ parent }) => parent?.type !== "external",
        initialValue: true,
      },
      {
        name: "file",
        title: "File",
        type: "file",
        hidden: ({ parent }) => parent?.type !== "download",
        validation: (Rule) =>
          Rule.custom((value, context) => {
            if (context.parent.type === "download" && !value) {
              return "This field is required";
            }
            return true;
          }),
      },
      {
        name: "func",
        title: "Function",
        type: "linkFunctions",
        hidden: ({ parent }) => parent?.type !== "function",
        validation: (Rule) =>
          Rule.custom((value, context) => {
            if (context.parent.type === "function" && !value) {
              return "This field is required";
            }
            return true;
          }),
      },
    ],
  },
];
