import { fireEvent, render, screen } from '@testing-library/react';

import { ConflictRecoveryPanel } from './ConflictRecovery';

test('shows conflict recovery choices and emits selected choice', () => {
  const handleResolveConflict = jest.fn();
  const { container } = render(<ConflictRecoveryPanel onResolveConflict={handleResolveConflict} />);

  fireEvent.click(screen.getByRole('button', { name: 'Desktop' }));
  fireEvent.click(screen.getByRole('button', { name: 'Markdown' }));

  expect(screen.getByLabelText('Conflict recovery')).toHaveTextContent('Conflict detected');
  expect(handleResolveConflict).toHaveBeenNthCalledWith(1, 'desktop');
  expect(handleResolveConflict).toHaveBeenNthCalledWith(2, 'markdown');
  expect(container).toMatchSnapshot();
});

test('disables recovery choices while resolution is running', () => {
  render(<ConflictRecoveryPanel isResolvingConflict onResolveConflict={jest.fn()} />);

  expect(screen.getByRole('button', { name: 'Desktop' })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Duplicate' })).toBeDisabled();
});
