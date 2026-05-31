import { fireEvent, render, screen } from '@testing-library/react';

import { RibbonEditor } from './RibbonEditor';

test('sets the Home ribbon tab active by default', () => {
  const { container } = render(<RibbonEditor />);

  expect(screen.getByRole('button', { name: 'Home' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByLabelText('Home commands')).toHaveTextContent('Basic Text');
  expect(container).toMatchSnapshot();
});

test('switches to insert commands when Insert is clicked', () => {
  render(<RibbonEditor />);

  fireEvent.click(screen.getByRole('button', { name: 'Insert' }));

  expect(screen.getByLabelText('Insert commands')).toHaveTextContent('Objects');
  expect(
    screen.getByRole('button', { name: 'Insert an image and keep the markdown reference in sync.' })
  ).toBeInTheDocument();
});

test('keeps keyboard focus styling on ribbon tabs', () => {
  render(<RibbonEditor />);

  expect(screen.getByRole('button', { name: 'Home' })).toHaveClass('focus-visible:outline');
  expect(screen.getByRole('button', { name: 'Home' })).toHaveClass(
    'focus-visible:outline-button-focus-ring'
  );
});

test('shows future insert commands as disabled controls', () => {
  render(<RibbonEditor />);

  fireEvent.click(screen.getByRole('button', { name: 'Insert' }));

  expect(screen.getByText('Table')).toBeVisible();
  expect(
    screen.getByRole('button', { name: 'Add a table once structured blocks are available.' })
  ).toBeDisabled();
});
