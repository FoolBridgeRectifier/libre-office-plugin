/* eslint-disable @typescript-eslint/consistent-type-imports */

declare module 'markdown-it-footnote' {
  const markdownItFootnotePlugin: import('markdown-it').PluginSimple;

  export default markdownItFootnotePlugin;
}

declare module 'markdown-it-obsidian-images' {
  function createMarkdownItObsidianImagesPlugin(
    options?: import('./markdown-sync/interfaces').MarkdownItObsidianImagesOptions
  ): import('markdown-it').PluginSimple;

  export default createMarkdownItObsidianImagesPlugin;
}

declare module 'markdown-it-obsidian-wikilinks' {
  function createMarkdownItObsidianWikilinksPlugin(
    options?: import('./markdown-sync/interfaces').MarkdownItObsidianWikilinksOptions
  ): import('markdown-it').PluginSimple;

  export default createMarkdownItObsidianWikilinksPlugin;
}

declare module 'markdown-it-task-lists' {
  const markdownItTaskListsPlugin: import('markdown-it').PluginWithOptions<
    import('./markdown-sync/interfaces').MarkdownItTaskListsOptions
  >;

  export default markdownItTaskListsPlugin;
}
