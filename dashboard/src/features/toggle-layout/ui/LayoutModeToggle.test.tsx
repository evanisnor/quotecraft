import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LayoutModeToggle } from './LayoutModeToggle';
import type { LayoutMode } from '@/shared/config';

describe('LayoutModeToggle', () => {
  it('renders a radiogroup labeled "Layout Mode"', () => {
    render(<LayoutModeToggle mode="single-page" onChange={jest.fn()} />);

    expect(screen.getByRole('radiogroup', { name: 'Layout Mode' })).toBeInTheDocument();
  });

  it('renders both layout mode options', () => {
    render(<LayoutModeToggle mode="single-page" onChange={jest.fn()} />);

    expect(screen.getByRole('radio', { name: 'Single Page' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Multi-Step' })).toBeInTheDocument();
  });

  test.each<{ mode: LayoutMode; checkedLabel: string; uncheckedLabel: string }>([
    { mode: 'single-page', checkedLabel: 'Single Page', uncheckedLabel: 'Multi-Step' },
    { mode: 'multi-step', checkedLabel: 'Multi-Step', uncheckedLabel: 'Single Page' },
  ])(
    'when mode is "$mode", "$checkedLabel" is checked and "$uncheckedLabel" is not',
    ({ mode, checkedLabel, uncheckedLabel }) => {
      render(<LayoutModeToggle mode={mode} onChange={jest.fn()} />);

      expect(screen.getByRole('radio', { name: checkedLabel })).toBeChecked();
      expect(screen.getByRole('radio', { name: uncheckedLabel })).not.toBeChecked();
    },
  );

  it('calls onChange with "multi-step" when Multi-Step is clicked while single-page is active', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<LayoutModeToggle mode="single-page" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Multi-Step' }));

    expect(onChange).toHaveBeenCalledWith('multi-step');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('calls onChange with "single-page" when Single Page is clicked while multi-step is active', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<LayoutModeToggle mode="multi-step" onChange={onChange} />);

    await user.click(screen.getByRole('radio', { name: 'Single Page' }));

    expect(onChange).toHaveBeenCalledWith('single-page');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('switches from multi-step to single-page via keyboard arrow key', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<LayoutModeToggle mode="multi-step" onChange={onChange} />);

    // Focus the checked radio and arrow up to the previous option
    screen.getByRole('radio', { name: 'Multi-Step' }).focus();
    await user.keyboard('{ArrowUp}');

    expect(onChange).toHaveBeenCalledWith('single-page');
  });
});
