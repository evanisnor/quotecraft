'use client';

import { FieldConfigPanel } from '@/features/configure-field';
import { DeleteFieldButton } from '@/features/delete-field';
import type { BaseFieldConfig } from '@/shared/config';

interface FieldEditorWidgetProps {
  field: BaseFieldConfig;
  onUpdate: (updated: BaseFieldConfig) => void;
  onDelete: () => void;
}

/**
 * Composes the shared field configuration panel with the delete field button.
 * The delete button uses an inline confirmation dialog before invoking onDelete.
 */
export function FieldEditorWidget({ field, onUpdate, onDelete }: FieldEditorWidgetProps) {
  return (
    <div>
      <FieldConfigPanel field={field} onUpdate={onUpdate} />
      <DeleteFieldButton onDelete={onDelete} />
    </div>
  );
}
