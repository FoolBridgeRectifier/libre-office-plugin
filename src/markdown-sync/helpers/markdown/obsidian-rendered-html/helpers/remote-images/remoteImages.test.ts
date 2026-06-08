import { maskRemoteMarkdownImageSources } from './remoteImages';

test('masks remote markdown image targets with deterministic placeholders', () => {
  const markdownSource = [
    '![Remote](https://example.com/image.png)',
    '![Upper](HTTP://example.com/upper.png)',
  ].join('\n');

  expect(maskRemoteMarkdownImageSources(markdownSource)).toBe(
    [
      '![Remote](libre-note-editor-remote-image-0.png)',
      '![Upper](libre-note-editor-remote-image-1.png)',
    ].join('\n')
  );
});

test('preserves local markdown image targets', () => {
  const markdownSource = '![Local](Attachments/image.png)';

  expect(maskRemoteMarkdownImageSources(markdownSource)).toBe(markdownSource);
});
