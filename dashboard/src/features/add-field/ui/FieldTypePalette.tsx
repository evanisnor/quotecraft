'use client';

import { FIELD_TYPES, FIELD_TYPE_LABELS } from '@/shared/config/fieldTypes';
import type { FieldType } from '@/shared/config/fieldTypes';

interface FieldTypePaletteProps {
  onAdd: (type: FieldType) => void;
}

export function FieldTypePalette({ onAdd }: FieldTypePaletteProps) {
  return (
    <section aria-label="Field types">
      {FIELD_TYPES.map((type) => (
        <button key={type} type="button" onClick={() => onAdd(type)}>
          {FIELD_TYPE_LABELS[type]}
        </button>
      ))}
    </section>
  );
}
