import { getTabButtonClassName } from './helpers';

test('uses reduced-motion classes for tab transitions', () => {
  expect(getTabButtonClassName(false)).toContain('motion-reduce:transition-none');
});
