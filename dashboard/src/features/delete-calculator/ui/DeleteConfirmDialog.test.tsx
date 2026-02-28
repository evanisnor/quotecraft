import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

describe('DeleteConfirmDialog', () => {
  it('renders the confirmation message', () => {
    render(
      <DeleteConfirmDialog calculatorId="calc-abc" onConfirm={jest.fn()} onCancel={jest.fn()} />,
    );

    expect(screen.getByText('Delete this calculator? This cannot be undone.')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /confirm deletion/i })).toBeInTheDocument();
  });

  it('calls onConfirm when the Delete button is clicked', async () => {
    const onConfirm = jest.fn();
    const user = userEvent.setup();

    render(
      <DeleteConfirmDialog calculatorId="calc-abc" onConfirm={onConfirm} onCancel={jest.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the Cancel button is clicked', async () => {
    const onCancel = jest.fn();
    const user = userEvent.setup();

    render(
      <DeleteConfirmDialog calculatorId="calc-abc" onConfirm={jest.fn()} onCancel={onCancel} />,
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
