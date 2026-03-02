import { render, screen, waitFor } from '@testing-library/react';
import { PreviewPane } from './PreviewPane';

describe('PreviewPane', () => {
  it('renders a region with name "Calculator Preview"', () => {
    render(<PreviewPane />);

    expect(screen.getByRole('region', { name: 'Calculator Preview' })).toBeInTheDocument();
  });

  it('attaches a shadow root to the host element', async () => {
    render(<PreviewPane />);

    const host = screen.getByTestId('preview-shadow-host');

    await waitFor(() => {
      expect(host.shadowRoot).not.toBeNull();
    });
  });

  it('renders children inside the shadow root', async () => {
    render(
      <PreviewPane>
        <p data-testid="shadow-child">Hello from shadow</p>
      </PreviewPane>,
    );

    const host = screen.getByTestId('preview-shadow-host');

    await waitFor(() => {
      expect(host.shadowRoot).not.toBeNull();
    });

    const child = host.shadowRoot!.querySelector('[data-testid="shadow-child"]');
    expect(child).not.toBeNull();
    expect(child!.textContent).toBe('Hello from shadow');
  });

  it('injects a style element into the shadow root', async () => {
    render(<PreviewPane />);

    const host = screen.getByTestId('preview-shadow-host');

    await waitFor(() => {
      expect(host.shadowRoot).not.toBeNull();
    });

    const styleEl = host.shadowRoot!.querySelector('style');
    expect(styleEl).not.toBeNull();
    expect(styleEl!.textContent).toContain('all: initial');
  });

  it('renders without error when no children are provided', () => {
    expect(() => render(<PreviewPane />)).not.toThrow();
  });
});
