import { render, screen } from '@testing-library/react';
import { PoweredByBadge } from './PoweredByBadge';

describe('PoweredByBadge', () => {
  it('renders a link to the QuoteCraft homepage', () => {
    render(<PoweredByBadge />);

    const link = screen.getByRole('link', { name: 'Powered by QuoteCraft' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://quotecraft.io');
  });

  it('renders the badge text "Powered by QuoteCraft"', () => {
    render(<PoweredByBadge />);

    expect(screen.getByText('Powered by QuoteCraft')).toBeInTheDocument();
  });

  it('has target="_blank"', () => {
    render(<PoweredByBadge />);

    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
  });

  it('has rel="noopener noreferrer"', () => {
    render(<PoweredByBadge />);

    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
