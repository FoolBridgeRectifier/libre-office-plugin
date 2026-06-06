export function isRemoteAttachmentPath(pathText: string | null): boolean {
  return pathText !== null && /^https?:\/\//i.test(pathText);
}

export function protectRemoteAttachmentElement(element: HTMLElement, pathText: string): void {
  const imageElement = element.matches('img') ? element : element.querySelector('img');

  element.dataset.libreRemoteImageSrc = pathText;
  element.dataset.libreDesktopOnly = 'true';
  element.dataset.libreProtected = 'desktop-only';
  element.setAttribute('contenteditable', 'false');

  element.removeAttribute('src');
  element.removeAttribute('srcset');
  imageElement?.removeAttribute('src');
  imageElement?.removeAttribute('srcset');
}
