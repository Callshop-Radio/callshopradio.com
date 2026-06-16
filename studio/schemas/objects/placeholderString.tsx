import { defineType } from "sanity";

import PlaceholderStringInput from "@/components/inputs/PlaceholderString";

export const placeholderString = defineType({
  name: "placeholderString",
  title: "Title",
  type: "string",
  components: {
    input: PlaceholderStringInput,
  },
  description: (
    <>
      If empty, displays the document title (<code>title</code>)
    </>
  ),
});
