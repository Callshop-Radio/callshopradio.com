export const locals = (S) =>
    S.listItem().title('Local').schemaType('local').child(S.documentTypeList('local'))
  