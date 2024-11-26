export const siteFallbacks = (S) =>
    S.listItem()
      .title('Fallbacks')
      .schemaType('fallback.global')
      .child(S.editor().title('Fallbacks').schemaType('fallback.global').documentId('fallback.global'))
  