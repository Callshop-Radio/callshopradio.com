export const showTags = (S) =>
    S.listItem().title('Show Tags').schemaType('tag.show').child(S.documentTypeList('tag.show'))
  