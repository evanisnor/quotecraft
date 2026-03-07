import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormulaInput } from './FormulaInput';

jest.mock('@quotecraft/formula-engine', () => ({
  ...jest.requireActual<typeof import('@quotecraft/formula-engine')>('@quotecraft/formula-engine'),
}));

// Helper: query for the preview output element
function queryPreview() {
  return document.querySelector('[data-testid="formula-preview"]');
}

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

    try {
      render(<FormulaInput expression="1 + 2" onChange={() => {}} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert.textContent).toBe('Invalid expression');
      expect(screen.getByLabelText('Formula expression')).toHaveAttribute('aria-invalid', 'true');
    } finally {
      engine.parse = originalParse;
    }
  });
});

describe('FormulaInput — live result preview', () => {
  it('shows no preview when expression is empty, even with fieldValues provided', () => {
    render(<FormulaInput expression="" onChange={() => {}} fieldValues={{ qty: 3, price: 10 }} />);

    expect(queryPreview()).not.toBeInTheDocument();
  });

  it('shows no preview when expression is only whitespace', () => {
    render(
      <FormulaInput expression="   " onChange={() => {}} fieldValues={{ qty: 3, price: 10 }} />,
    );

    expect(queryPreview()).not.toBeInTheDocument();
  });

  it('shows no preview when expression has a parse error', () => {
    render(
      <FormulaInput expression="1 +" onChange={() => {}} fieldValues={{ qty: 3, price: 10 }} />,
    );

    expect(queryPreview()).not.toBeInTheDocument();
  });

  it('shows the computed numeric result when expression is valid and fieldValues are provided', () => {
    render(
      <FormulaInput
        expression="{qty} * {price}"
        onChange={() => {}}
        fieldValues={{ qty: 3, price: 10 }}
      />,
    );

    const preview = queryPreview();
    expect(preview).toBeInTheDocument();
    expect(preview?.textContent).toBe('Preview: 30');
  });

  it('shows the computed result for a constant expression without fieldValues', () => {
    render(<FormulaInput expression="2 + 3" onChange={() => {}} />);

    const preview = queryPreview();
    expect(preview).toBeInTheDocument();
    expect(preview?.textContent).toBe('Preview: 5');
  });

  it('shows an evaluation error when expression references an unknown variable (fieldValues is empty)', () => {
    render(<FormulaInput expression="{unknown}" onChange={() => {}} fieldValues={{}} />);

    const preview = queryPreview();
    expect(preview).toBeInTheDocument();
    expect(preview?.textContent).toContain('Evaluation error:');
  });

  it('shows the Infinity result for division by zero (engine JS semantics, not an error)', () => {
    // The formula engine follows JavaScript semantics: 1/0 → Infinity, not an error.
    render(<FormulaInput expression="1 / 0" onChange={() => {}} />);

    const preview = queryPreview();
    expect(preview).toBeInTheDocument();
    expect(preview?.textContent).toBe('Preview: Infinity');
  });

  it('the result element is not a role="alert" — it is informational output', () => {
    render(<FormulaInput expression="{qty} * 2" onChange={() => {}} fieldValues={{ qty: 5 }} />);

    // The preview element exists and contains the result
    const preview = queryPreview();
    expect(preview).toBeInTheDocument();

    // It must NOT be a role="alert"
    expect(preview).not.toHaveAttribute('role', 'alert');
  });

  it('preview updates when the expression changes to a new valid value', () => {
    const { rerender } = render(<FormulaInput expression="2 + 2" onChange={() => {}} />);

    expect(queryPreview()?.textContent).toBe('Preview: 4');

    rerender(<FormulaInput expression="10 * 3" onChange={() => {}} />);

    expect(queryPreview()?.textContent).toBe('Preview: 30');
  });

  it('preview disappears when expression becomes empty after having been valid', () => {
    const { rerender } = render(<FormulaInput expression="42" onChange={() => {}} />);

    expect(queryPreview()).toBeInTheDocument();

    rerender(<FormulaInput expression="" onChange={() => {}} />);

    expect(queryPreview()).not.toBeInTheDocument();
  });

  it('preview disappears when expression becomes invalid after having been valid', () => {
    const { rerender } = render(<FormulaInput expression="42" onChange={() => {}} />);

    expect(queryPreview()).toBeInTheDocument();

    rerender(<FormulaInput expression="42 +" onChange={() => {}} />);

    expect(queryPreview()).not.toBeInTheDocument();
  });
});
