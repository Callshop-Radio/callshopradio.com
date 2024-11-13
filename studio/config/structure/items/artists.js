export const artists = (S) =>
    S.listItem().title('Artists').schemaType('artist').child(S.documentTypeList('artist'))
  