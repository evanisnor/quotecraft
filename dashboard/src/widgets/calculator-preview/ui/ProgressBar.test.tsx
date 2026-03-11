import { render, screen } from '@testing-library/react';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
  it('renders the step text "Step X of Y"', () => {
    render(<ProgressBar currentStep={2} totalSteps={4} />);

    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument();
  });

  it('has role="progressbar" with correct aria attributes', () => {
    render(<ProgressBar currentStep={1} totalSteps={3} />);

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    expect(progressbar).toHaveAttribute('aria-valuenow', '1');
    expect(progressbar).toHaveAttribute('aria-valuemin', '1');
    expect(progressbar).toHaveAttribute('aria-valuemax', '3');
    expect(progressbar).toHaveAttribute('aria-valuetext', 'Step 1 of 3');
  });

  it('computes fill width as a percentage of currentStep / totalSteps', () => {
    render(<ProgressBar currentStep={1} totalSteps={3} />);

    // The fill div is the first child of the progressbar element
    const progressbar = screen.getByRole('progressbar');
    const fillDiv = progressbar.firstChild as HTMLElement;
    expect(fillDiv).toHaveStyle({ width: `${(1 / 3) * 100}%` });
  });

  it('computes fill width of 100% when on the last step', () => {
    render(<ProgressBar currentStep={3} totalSteps={3} />);

    const progressbar = screen.getByRole('progressbar');
    const fillDiv = progressbar.firstChild as HTMLElement;
    expect(fillDiv).toHaveStyle({ width: '100%' });
  });
});
