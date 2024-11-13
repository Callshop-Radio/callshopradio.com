export const words = (S) =>
    S.listItem()
      .title('Words Page')
      .schemaType('words')
      .child(S.editor().title('Words').schemaType('words').documentId('words'))
  