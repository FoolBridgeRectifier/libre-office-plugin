export type AttachmentStatus = 'available' | 'broken' | 'remote';

export interface InlineMarkdownReader {
  (node: Node): string;
}
