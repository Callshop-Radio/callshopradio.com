export const categories = (S) =>
  S.listItem()
    .title("Categories")
    .schemaType("category")
    .child(S.documentTypeList("category"));
