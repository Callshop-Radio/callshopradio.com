export const articleTags = (S) =>
    S.listItem().title('Article Tags').schemaType('tag.article').child(S.documentTypeList('tag.article'))
  