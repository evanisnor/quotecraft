import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { CalculatorSummary } from '../model/types';
import { CalculatorCard } from './CalculatorCard';

const mockCalculator: CalculatorSummary = {
  id: 'abcdef12-1234-5678-abcd-ef1234567890',
  name: 'My Calculator',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-06-15T00:00:00Z'),
};

describe('CalculatorCard', () => {
  it('renders the calculator name, short id, and last modified date', () => {
    render(<CalculatorCard calculator={mockCalculator} onOpen={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByRole('heading', { name: 'My Calculator' })).toBeInTheDocument();
    // shortId is first 8 chars: 'abcdef12'
    expect(screen.getByText('abcdef12')).toBeInTheDocument();
    expect(
      screen.getByText(`Last modified: ${mockCalculator.updatedAt.toLocaleDateString()}`),
    ).toBeInTheDocument();
  });

  it('calls onOpen with the calculator id when Open is clicked', async () => {
    const onOpen = jest.fn();
    const user = userEvent.setup();

    render(<CalculatorCard calculator={mockCalculator} onOpen={onOpen} onDelete={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: /open/i }));

    expect(onOpen).toHaveBeenCalledWith(mockCalculator.id);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete with the calculator id when Delete is clicked', async () => {
    const onDelete = jest.fn();
    const user = userEvent.setup();

    render(<CalculatorCard calculator={mockCalculator} onOpen={jest.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledWith(mockCalculator.id);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
