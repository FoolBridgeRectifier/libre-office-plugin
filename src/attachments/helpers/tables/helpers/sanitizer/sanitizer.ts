export function sanitizeHtmlSource(htmlSource: string): string {
  const htmlDocument = new DOMParser().parseFromString(htmlSource, 'text/html');

  sanitizeElement(htmlDocument.body);

  return htmlDocument.body.innerHTML;
}

export function sanitizeElement(rootElement: Element): void {
  for (const unsafeElement of rootElement.querySelectorAll('iframe,object,script')) {
    unsafeElement.remove();
  }

  if (rootElement instanceof HTMLElement) {
    removeUnsafeAttributes(rootElement);
  }

  for (const element of rootElement.querySelectorAll<HTMLElement>('*')) {
    removeUnsafeAttributes(element);
  }
}

function removeUnsafeAttributes(element: HTMLElement): void {
  for (const attribute of Array.from(element.attributes)) {
    if (
      /^on/i.test(attribute.name) ||
      attribute.name.startsWith('data-libre-') ||
      isDangerousAttribute(attribute.name, attribute.value)
    ) {
      element.removeAttribute(attribute.name);
    }
  }
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
