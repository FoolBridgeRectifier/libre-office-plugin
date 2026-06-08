export function createHtmlElementFromSource(htmlSource: string): HTMLElement {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');
  const firstElement = htmlDocument.body.firstElementChild;

  return firstElement instanceof HTMLElement ? firstElement : document.createElement('div');
}
