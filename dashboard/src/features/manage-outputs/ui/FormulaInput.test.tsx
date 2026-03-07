import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormulaInput } from './FormulaInput';

jest.mock('@quotecraft/formula-engine', () => ({
  ...jest.requireActual<typeof import('@quotecraft/formula-engine')>('@quotecraft/formula-engine'),
}));

describe('FormulaInput', () => {
  it('renders the formula expression input with a label', () => {
    render(<FormulaInput expression="" onChange={() => {}} />);

    expect(screen.getByLabelText('Formula expression')).toBeInTheDocument();
  });

  it('renders with the current expression value', () => {
    render(<FormulaInput expression="{price} * 2" onChange={() => {}} />);

    expect(screen.getByLabelText('Formula expression')).toHaveValue('{price} * 2');
  });

  it('shows no error when expression is empty', () => {
    render(<FormulaInput expression="" onChange={() => {}} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Formula expression')).toHaveAttribute('aria-invalid', 'false');
  });

  it('shows no error when expression is only whitespace', () => {
    render(<FormulaInput expression="   " onChange={() => {}} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Formula expression')).toHaveAttribute('aria-invalid', 'false');
  });

  it('shows no error when expression is valid', () => {
    render(<FormulaInput expression="{price} * 1.1" onChange={() => {}} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Formula expression')).toHaveAttribute('aria-invalid', 'false');
  });

  it('calls onChange when the user types in the input', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<FormulaInput expression="" onChange={onChange} />);

    await user.type(screen.getByLabelText('Formula expression'), '5');

    expect(onChange).toHaveBeenCalledWith('5');
  });

  it('calls onChange with the full updated value on each keystroke', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    // Controlled component: expression prop stays empty, but we verify each call
    render(<FormulaInput expression="" onChange={onChange} />);

    await user.type(screen.getByLabelText('Formula expression'), 'ab');

    expect(onChange).toHaveBeenNthCalledWith(1, 'a');
    expect(onChange).toHaveBeenNthCalledWith(2, 'b');
  });

  it('shows an error when the expression is syntactically invalid (incomplete binary op)', () => {
    render(<FormulaInput expression="1 +" onChange={() => {}} />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).not.toBe('');

    expect(screen.getByLabelText('Formula expression')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows an error when the expression contains an unrecognized character', () => {
    render(<FormulaInput expression="@" onChange={() => {}} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Formula expression')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows an error when the expression has a bare identifier that is not a function', () => {
    render(<FormulaInput expression="foo" onChange={() => {}} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Formula expression')).toHaveAttribute('aria-invalid', 'true');
  });

  it('links the error message to the input via aria-describedby', () => {
    render(<FormulaInput expression="1 +" onChange={() => {}} />);

    const input = screen.getByLabelText('Formula expression');
    const errorId = input.getAttribute('aria-describedby');
    expect(errorId).not.toBeNull();

    const errorEl = document.getElementById(errorId!);
    expect(errorEl).not.toBeNull();
    expect(errorEl?.textContent).not.toBe('');
  });

  it('does not set aria-describedby when expression is valid', () => {
    render(<FormulaInput expression="42" onChange={() => {}} />);

    const input = screen.getByLabelText('Formula expression');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('clears the error when the expression is changed to empty', () => {
    const { rerender } = render(<FormulaInput expression="1 +" onChange={() => {}} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<FormulaInput expression="" onChange={() => {}} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Formula expression')).toHaveAttribute('aria-invalid', 'false');
  });

  it('clears the error when the expression is changed to a valid value', () => {
    const { rerender } = render(<FormulaInput expression="1 +" onChange={() => {}} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<FormulaInput expression="1 + 2" onChange={() => {}} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Formula expression')).toHaveAttribute('aria-invalid', 'false');
  });

  it('accepts an optional fieldVariableNames prop without error', () => {
    render(
      <FormulaInput
        expression="{qty} * {price}"
        onChange={() => {}}
        fieldVariableNames={['qty', 'price']}
      />,
    );

    // Variable references that exist in fieldVariableNames — no error expected
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('does not show an error for unknown variable names at parse time', () => {
    // Unknown variables are only caught at evaluate time, not parse time
    render(<FormulaInput expression="{unknown_var}" onChange={() => {}} fieldVariableNames={[]} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a generic error message when the formula engine throws an unexpected error type', () => {
    const engine = jest.requireMock<typeof import('@quotecraft/formula-engine')>(
      '@quotecraft/formula-engine',
    );
    const originalParse = engine.parse;
    engine.parse = () => {
      throw new Error('Unexpected internal error');
    };

    render(<FormulaInput expression="1 + 2" onChange={() => {}} />);

    engine.parse = originalParse;

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).toBe('Invalid expression');
    expect(screen.getByLabelText('Formula expression')).toHaveAttribute('aria-invalid', 'true');
  });
});
