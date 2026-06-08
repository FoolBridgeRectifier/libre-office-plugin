export function isSafeAttachmentPath(pathText: string): boolean {
  const normalizedPath = pathText.trim().replace(/\\/g, '/');

  return (
    normalizedPath.length > 0 &&
    !normalizedPath.startsWith('/') &&
    !/^[a-z][a-z0-9+.-]*:/i.test(normalizedPath) &&
    !normalizedPath.split('/').includes('..')
  );
}

export function isSafeStoredAttachmentTarget(target: string, allowRemoteImage: boolean): boolean {
  return (allowRemoteImage && /^https?:\/\//i.test(target)) || isSafeAttachmentPath(target);
}
