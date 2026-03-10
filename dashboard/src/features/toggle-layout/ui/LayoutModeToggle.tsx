'use client';

import type { LayoutMode } from '@/shared/config';

interface LayoutModeToggleProps {
  mode: LayoutMode;
  onChange: (mode: LayoutMode) => void;
}

export function LayoutModeToggle({ mode, onChange }: LayoutModeToggleProps) {
  return (
    <div role="radiogroup" aria-labelledby="layout-mode-legend">
      <p id="layout-mode-legend">Layout Mode</p>
      <label>
        <input
          type="radio"
          name="layout-mode"
          value="single-page"
          checked={mode === 'single-page'}
          onChange={() => onChange('single-page')}
        />
        Single Page
      </label>
      <label>
        <input
          type="radio"
          name="layout-mode"
          value="multi-step"
          checked={mode === 'multi-step'}
          onChange={() => onChange('multi-step')}
        />
        Multi-Step
      </label>
    </div>
  );
}
