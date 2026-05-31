import '@testing-library/jest-dom';

jest.mock('@fluentui/react-icons', () => {
  function createMockFluentIcon() {
    return function MockFluentIcon() {
      return null;
    };
  }

  return {
    ClipboardPaste24Regular: createMockFluentIcon(),
    Eye24Regular: createMockFluentIcon(),
    Image24Regular: createMockFluentIcon(),
    Link24Regular: createMockFluentIcon(),
    PaintBrush24Regular: createMockFluentIcon(),
    Table24Regular: createMockFluentIcon(),
    TextBold24Regular: createMockFluentIcon(),
    TextItalic24Regular: createMockFluentIcon(),
  };
});
