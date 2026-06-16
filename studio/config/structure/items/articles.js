export const articles = (S) =>
  S.listItem()
    .title("Articles")
    .schemaType("article")
    .child(S.documentTypeList("article"));
