'use client';

import type { ThemeConfig } from '@/shared/config';

interface ColorPickerPanelProps {
  theme: ThemeConfig;
  onChange: (theme: ThemeConfig) => void;
}

export function ColorPickerPanel({ theme, onChange }: ColorPickerPanelProps) {
  function handleChange(key: keyof ThemeConfig, value: string): void {
    onChange({ ...theme, [key]: value });
  }

  return (
    <section aria-label="Theme Colors">
      <label htmlFor="color-primary">Primary Color</label>
      <input
        id="color-primary"
        type="color"
        value={theme.primaryColor}
        onChange={(e) => handleChange('primaryColor', e.target.value)}
      />

      <label htmlFor="color-secondary">Secondary Color</label>
      <input
        id="color-secondary"
        type="color"
        value={theme.secondaryColor}
        onChange={(e) => handleChange('secondaryColor', e.target.value)}
      />

      <label htmlFor="color-background">Background Color</label>
      <input
        id="color-background"
        type="color"
        value={theme.backgroundColor}
        onChange={(e) => handleChange('backgroundColor', e.target.value)}
      />

      <label htmlFor="color-text">Text Color</label>
      <input
        id="color-text"
        type="color"
        value={theme.textColor}
        onChange={(e) => handleChange('textColor', e.target.value)}
      />
    </section>
  );
}
