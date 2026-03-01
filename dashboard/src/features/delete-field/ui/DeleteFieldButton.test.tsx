import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteFieldButton } from './DeleteFieldButton';

describe('DeleteFieldButton', () => {
  it('renders the Delete field button in initial state', () => {
    render(<DeleteFieldButton onDelete={jest.fn()} />);

    expect(screen.getByRole('button', { name: /delete field/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clicking Delete field shows the confirmation UI', async () => {
    const user = userEvent.setup();

    render(<DeleteFieldButton onDelete={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /delete field/i }));

    expect(screen.getByRole('dialog', { name: /confirm field deletion/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete field/i })).not.toBeInTheDocument();
  });

  it('clicking Cancel returns to initial state', async () => {
    const user = userEvent.setup();

    render(<DeleteFieldButton onDelete={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /delete field/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByRole('button', { name: /delete field/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('pressing Escape in confirmation returns to initial state', async () => {
    const user = userEvent.setup();

    render(<DeleteFieldButton onDelete={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /delete field/i }));
    await user.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: /delete field/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('pressing Escape when not in confirmation state has no effect', async () => {
    const user = userEvent.setup();

    render(<DeleteFieldButton onDelete={jest.fn()} />);

    await user.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: /delete field/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clicking Confirm calls onDelete exactly once', async () => {
    const onDelete = jest.fn();
    const user = userEvent.setup();

    render(<DeleteFieldButton onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /delete field/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('clicking Confirm calls onDelete with no arguments', async () => {
    const onDelete = jest.fn();
    const user = userEvent.setup();

    render(<DeleteFieldButton onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /delete field/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(onDelete).toHaveBeenCalledWith();
  });

  it('confirmation dialog has aria-modal set to true', async () => {
    const user = userEvent.setup();

    render(<DeleteFieldButton onDelete={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /delete field/i }));

    expect(screen.getByRole('dialog', { name: /confirm field deletion/i })).toHaveAttribute(
      'aria-modal',
      'true',
    );
  });

  it('component returns to initial state after confirming deletion (if not unmounted)', async () => {
    const onDelete = jest.fn();
    const user = userEvent.setup();

    render(<DeleteFieldButton onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /delete field/i }));
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    expect(screen.getByRole('button', { name: /delete field/i })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
