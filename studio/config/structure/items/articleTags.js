export const articleTags = (S) =>
  S.listItem()
    .title("Articles")
    .schemaType("tag.article")
    .child(S.documentTypeList("tag.article"));
