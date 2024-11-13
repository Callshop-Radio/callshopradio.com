export const error = (S) =>
  S.listItem()
    .title('404 Page')
    .schemaType('error')
    .child(S.editor().title('404 Page').schemaType('error').documentId('error'))
