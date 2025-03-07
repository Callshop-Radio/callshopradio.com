export const siteFallbacks = (S) =>
    S.listItem()
      .title('Fallbacks')
      .schemaType('fallbackGlobal')
      .child(S.editor().title('Fallbacks').schemaType('fallbackGlobal').documentId('fallbackGlobal'))
  