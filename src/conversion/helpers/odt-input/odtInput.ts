import { ODT_CONVERSION_HTML_FILE_NAME, ODT_CONVERSION_OUTPUT_FILE_NAME } from '../../constants';

export function getOdtConversionHtmlPath(folderPath: string): string {
  return `${folderPath}/${ODT_CONVERSION_HTML_FILE_NAME}`;
}

export function getOdtConversionOutputPath(folderPath: string): string {
  return `${folderPath}/${ODT_CONVERSION_OUTPUT_FILE_NAME}`;
}

export function createLibreOfficeHtmlDocument(htmlSource: string): string {
  return [
    '<!doctype html>',
    '<html>',
    '<head><meta charset="utf-8"></head>',
    `<body>${htmlSource}</body>`,
    '</html>',
  ].join('');
}
