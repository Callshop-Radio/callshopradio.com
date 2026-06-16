import { CodeBlockIcon } from "@sanity/icons";
import { defineType } from "sanity";
import { defaultCookieSections } from "@/utils/defaultCookieSections";

const TITLE = "Cookie Banner";

export const siteCookieBanner = defineType({
  name: "siteCookieBanner",
  type: "document",
  title: TITLE,
  icon: CodeBlockIcon,

  fields: [
    {
      title: "Use Cookie Banner",
      name: "useCookieBanner",
      type: "boolean",
      initialValue: false,
    },
    {
      title: "Consent Modal Texts",
      name: "consentModal",
      type: "object",
      fields: [
        {
          title: "Description",
          name: "description",
          type: "string",
          initialValue:
            "Our website uses essential cookies to ensure its proper operation and tracking cookies to understand how you interact with it. The latter will be set only after consent.",
        },
        {
          title: "Accept All Button",
          name: "acceptAllBtn",
          type: "string",
          initialValue: "Accept",
        },
        {
          title: "Accept Necessary Button",
          name: "acceptNecessaryBtn",
          type: "string",
          initialValue: "Reject",
        },
        {
          title: "Show Preferences Button",
          name: "showPreferencesBtn",
          type: "string",
          initialValue: "Manage preferences",
        },
      ],
    },
    {
      title: "Preferences Modal Texts",
      name: "preferencesModal",
      type: "object",
      fields: [
        {
          title: "Title",
          name: "title",
          type: "string",
          initialValue: "Cookie preferences",
        },
        {
          title: "Accept All Button",
          name: "acceptAllBtn",
          type: "string",
          initialValue: "Accept all",
        },
        {
          title: "Accept Necessary Button",
          name: "acceptNecessaryBtn",
          type: "string",
          initialValue: "Reject all",
        },
        {
          title: "Save Preferences Button",
          name: "savePreferencesBtn",
          type: "string",
          initialValue: "Save preferences",
        },
        {
          title: "Sections",
          name: "sections",
          type: "code",
          options: {
            language: "json",
            languageAlternatives: [
              { title: "JSON", value: "json", mode: "json" },
            ],
          },
          initialValue: defaultCookieSections,
        },
        // {
        //   title: 'Sections',
        //   name: 'sections',
        //   type: 'array',
        //   of: [
        //     {
        //       name: 'cookieSection',
        //       title: 'Section',
        //       type: 'object',
        //       icon: StackIcon,
        //       fields: [
        //         {
        //           title: 'Title',
        //           name: 'title',
        //           type: 'string',
        //         },
        //         {
        //           title: 'Description',
        //           name: 'description',
        //           type: 'string',
        //         },
        //         {
        //           title: 'Linked Category',
        //           name: 'linkedCategory',
        //           type: 'string',
        //         },
        //         {
        //           title: 'Cookie Table',
        //           name: 'cookieTable',
        //           type: 'object',
        //           fields: [
        //             {
        //               title: 'Headers',
        //               name: 'headers',
        //               type: 'object',
        //               fields: [
        //                 {
        //                   title: 'Name',
        //                   name: 'name',
        //                   type: 'string',
        //                   initialValue: 'Name',
        //                 },
        //                 {
        //                   title: 'Service',
        //                   name: 'title',
        //                   type: 'string',
        //                   initialValue: 'Service',
        //                 },
        //                 {
        //                   title: 'Description',
        //                   name: 'description',
        //                   type: 'string',
        //                   initialValue: 'Description',
        //                 },
        //               ],
        //             },
        //             {
        //               title: 'Table',
        //               name: 'body',
        //               type: 'array',
        //               of: [
        //                 {
        //                   title: 'Table Item',
        //                   name: 'tableItem',
        //                   type: 'object',
        //                   icon: ThLargeIcon,
        //                   fields: [
        //                     {
        //                       title: 'Name',
        //                       name: 'name',
        //                       type: 'string',
        //                       initialValue: 'Name',
        //                     },
        //                     {
        //                       title: 'Service',
        //                       name: 'title',
        //                       type: 'string',
        //                       initialValue: 'Service',
        //                     },
        //                     {
        //                       title: 'Description',
        //                       name: 'description',
        //                       type: 'string',
        //                       initialValue: 'Description',
        //                     },
        //                   ],
        //                 },
        //               ],
        //             },
        //           ],
        //         },
        //       ],
        //     },
        //   ],
        // },
      ],
    },
  ],
  preview: {
    prepare() {
      return {
        title: TITLE,
      };
    },
  },
});
