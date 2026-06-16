export const globalTags = (S) =>
  S.listItem()
    .title("Global Tags")
    .schemaType("tag.global")
    .child(S.documentTypeList("tag.global"));
