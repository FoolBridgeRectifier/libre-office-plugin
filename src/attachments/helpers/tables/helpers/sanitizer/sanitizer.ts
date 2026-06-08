export function sanitizeHtmlSource(htmlSource: string): string {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');

  sanitizeElement(htmlDocument.body);

  return htmlDocument.body.innerHTML;
}

export function sanitizeElement(rootElement: Element): void {
  rootElement.querySelectorAll('iframe,object,script').forEach((unsafeElement) => {
    unsafeElement.remove();
  });

  if (rootElement instanceof HTMLElement) {
    removeUnsafeAttributes(rootElement);
  }

  rootElement.querySelectorAll<HTMLElement>('*').forEach((element) => {
    removeUnsafeAttributes(element);
  });
}

function removeUnsafeAttributes(element: HTMLElement): void {
  Array.from(element.attributes).forEach((attribute) => {
    if (isUnsafeAttribute(attribute)) {
      element.removeAttribute(attribute.name);
    }
  });
}

function isUnsafeAttribute(attribute: Attr): boolean {
  return (
    /^on/i.test(attribute.name) ||
    attribute.name.startsWith('data-libre-') ||
    isDangerousAttribute(attribute.name, attribute.value)
  );
}

function isDangerousAttribute(attributeName: string, attributeValue: string): boolean {
  const compactAttributeValue = removeWhitespaceAndControlCharacters(attributeValue.toLowerCase());

  if (/^(?:javascript|vbscript|data):/.test(compactAttributeValue)) {
    return true;
  }

  return (
    attributeName.toLowerCase() === 'style' &&
    /url\(|expression\(|behavior:/.test(attributeValue.toLowerCase())
  );
}

function removeWhitespaceAndControlCharacters(attributeValue: string): string {
  return Array.from(attributeValue)
    .filter((character) => character > ' ' && character !== '\u007f')
    .join('');
}
