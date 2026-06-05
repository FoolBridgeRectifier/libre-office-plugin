export function createMetadataCacheMock() {
  const eventHandlers = new Map<string, (...eventArguments: unknown[]) => void>();

  return {
    eventHandlers,
    getFileCache: jest.fn(),
    getFirstLinkpathDest: jest.fn(),
    on: jest.fn((eventName: string, callback: (...eventArguments: unknown[]) => void) => {
      eventHandlers.set(eventName, callback);

      return { id: 'metadata-event-ref' };
    }),
  };
}
