import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPickerPanel } from './ColorPickerPanel';
import type { ThemeConfig } from '@/shared/config';

const defaultTheme: ThemeConfig = {
  primaryColor: '#3B82F6',
  secondaryColor: '#6B7280',
  backgroundColor: '#FFFFFF',
  textColor: '#111827',
};

describe('ColorPickerPanel', () => {
  it('renders section with aria-label "Theme Colors"', () => {
    render(<ColorPickerPanel theme={defaultTheme} onChange={jest.fn()} />);

    expect(screen.getByRole('region', { name: 'Theme Colors' })).toBeInTheDocument();
  });

  it('renders all four labeled color inputs', () => {
    render(<ColorPickerPanel theme={defaultTheme} onChange={jest.fn()} />);

    expect(screen.getByLabelText('Primary Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Secondary Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Background Color')).toBeInTheDocument();
    expect(screen.getByLabelText('Text Color')).toBeInTheDocument();
  });

  it('shows the current primaryColor value from the theme prop', () => {
    render(<ColorPickerPanel theme={defaultTheme} onChange={jest.fn()} />);

    expect(screen.getByLabelText('Primary Color')).toHaveValue('#3b82f6');
  });

  it('shows the current secondaryColor value from the theme prop', () => {
    render(<ColorPickerPanel theme={defaultTheme} onChange={jest.fn()} />);

    expect(screen.getByLabelText('Secondary Color')).toHaveValue('#6b7280');
  });

  it('shows the current backgroundColor value from the theme prop', () => {
    render(<ColorPickerPanel theme={defaultTheme} onChange={jest.fn()} />);

    expect(screen.getByLabelText('Background Color')).toHaveValue('#ffffff');
  });

  it('shows the current textColor value from the theme prop', () => {
    render(<ColorPickerPanel theme={defaultTheme} onChange={jest.fn()} />);

    expect(screen.getByLabelText('Text Color')).toHaveValue('#111827');
  });

  describe('onChange called with updated theme', () => {
    // jsdom normalizes hex color values to lowercase when reading from color inputs,
    // so test values are lowercase to match what e.target.value provides.
    test.each<{ label: string; key: keyof ThemeConfig; newValue: string }>([
      { label: 'Primary Color', key: 'primaryColor', newValue: '#ff0000' },
      { label: 'Secondary Color', key: 'secondaryColor', newValue: '#00ff00' },
      { label: 'Background Color', key: 'backgroundColor', newValue: '#0000ff' },
      { label: 'Text Color', key: 'textColor', newValue: '#abcdef' },
    ])('calls onChange with updated $key when $label changes', ({ label, key, newValue }) => {
      const onChange = jest.fn();
      render(<ColorPickerPanel theme={defaultTheme} onChange={onChange} />);

      fireEvent.change(screen.getByLabelText(label), { target: { value: newValue } });

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({ ...defaultTheme, [key]: newValue });
    });
  });

  describe('onChange preserves other colors when one changes', () => {
    test.each<{ label: string; key: keyof ThemeConfig; otherKeys: (keyof ThemeConfig)[] }>([
      {
        label: 'Primary Color',
        key: 'primaryColor',
        otherKeys: ['secondaryColor', 'backgroundColor', 'textColor'],
      },
      {
        label: 'Secondary Color',
        key: 'secondaryColor',
        otherKeys: ['primaryColor', 'backgroundColor', 'textColor'],
      },
      {
        label: 'Background Color',
        key: 'backgroundColor',
        otherKeys: ['primaryColor', 'secondaryColor', 'textColor'],
      },
      {
        label: 'Text Color',
        key: 'textColor',
        otherKeys: ['primaryColor', 'secondaryColor', 'backgroundColor'],
      },
    ])('changing $label does not alter the other theme keys', ({ label, key, otherKeys }) => {
      const onChange = jest.fn();
      render(<ColorPickerPanel theme={defaultTheme} onChange={onChange} />);

      fireEvent.change(screen.getByLabelText(label), { target: { value: '#123456' } });

      const updatedTheme = onChange.mock.calls[0][0] as ThemeConfig;
      expect(updatedTheme[key]).toBe('#123456');
      for (const otherKey of otherKeys) {
        expect(updatedTheme[otherKey]).toBe(defaultTheme[otherKey]);
      }
    });
  });
});
