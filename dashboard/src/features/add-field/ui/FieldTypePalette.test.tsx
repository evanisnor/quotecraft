import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldTypePalette } from './FieldTypePalette';
import { FIELD_TYPES, FIELD_TYPE_LABELS } from '@/shared/config/fieldTypes';
import type { FieldType } from '@/shared/config/fieldTypes';

describe('FieldTypePalette', () => {
  it('renders all 7 field type buttons with their correct labels', () => {
    render(<FieldTypePalette onAdd={jest.fn()} />);

    for (const type of FIELD_TYPES) {
      expect(screen.getByRole('button', { name: FIELD_TYPE_LABELS[type] })).toBeInTheDocument();
    }
  });

  test.each<{ type: FieldType; label: string }>([
    { type: 'dropdown', label: 'Dropdown' },
    { type: 'radio', label: 'Radio Button' },
    { type: 'checkbox', label: 'Checkbox' },
    { type: 'number', label: 'Number Input' },
    { type: 'slider', label: 'Slider' },
    { type: 'text', label: 'Text Input' },
    { type: 'image_select', label: 'Image Select' },
  ])('clicking "$label" calls onAdd with "$type"', async ({ type, label }) => {
    const onAdd = jest.fn();
    const user = userEvent.setup();

    render(<FieldTypePalette onAdd={onAdd} />);

    await user.click(screen.getByRole('button', { name: label }));

    expect(onAdd).toHaveBeenCalledWith(type);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
