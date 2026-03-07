import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SaveStatusIndicator } from './SaveStatusIndicator';

describe('SaveStatusIndicator', () => {
  it('renders the Save button', () => {
    render(<SaveStatusIndicator status="idle" onSave={() => {}} />);

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('shows no status text when status is idle', () => {
    render(<SaveStatusIndicator status="idle" onSave={() => {}} />);

    expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    expect(screen.queryByText('Error saving')).not.toBeInTheDocument();
  });

  it('shows "Saving..." when status is saving', () => {
    render(<SaveStatusIndicator status="saving" onSave={() => {}} />);

    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('shows "Saved" when status is saved', () => {
    render(<SaveStatusIndicator status="saved" onSave={() => {}} />);

    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('shows "Error saving" when status is error', () => {
    render(<SaveStatusIndicator status="error" onSave={() => {}} />);

    expect(screen.getByText('Error saving')).toBeInTheDocument();
  });

  it('shows an alert message when status is error', () => {
    render(<SaveStatusIndicator status="error" onSave={() => {}} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not show an alert when status is not error', () => {
    render(<SaveStatusIndicator status="saved" onSave={() => {}} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('calls onSave when the Save button is clicked', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    render(<SaveStatusIndicator status="idle" onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('renders a live region for screen reader announcements', () => {
    render(<SaveStatusIndicator status="idle" onSave={() => {}} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
