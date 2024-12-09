export const showTags = (S) =>
    S.listItem().title('Show').schemaType('tag.show').child(S.documentTypeList('tag.show'))
  