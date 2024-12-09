export const serviceTags = (S) =>
    S.listItem().title('Service').schemaType('tag.service').child(S.documentTypeList('tag.service'))
  