export const pages = (S) =>
  S.listItem()
    .title("Pages")
    .schemaType("page")
    .child(S.documentTypeList("page"));
