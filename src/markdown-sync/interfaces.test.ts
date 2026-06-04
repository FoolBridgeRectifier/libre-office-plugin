import type { RichDocumentPluginData } from '../rich-documents/interfaces';

test('keeps plugin data type available for strict shared mappings', () => {
  const pluginData: RichDocumentPluginData = {
    mappings: [],
    version: 1,
  };

  expect(pluginData.version).toBe(1);
});
