export const sets = (S) =>
  S.listItem().title("Sets").schemaType("set").child(S.documentTypeList("set"));
