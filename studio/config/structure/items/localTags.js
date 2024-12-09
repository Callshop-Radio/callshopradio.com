export const localTags = (S) =>
    S.listItem().title('Local').schemaType('tag.local').child(S.documentTypeList('tag.local'))
  