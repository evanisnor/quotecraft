'use client';

import {
  DropdownFieldConfigPanel,
  RadioFieldConfigPanel,
  CheckboxFieldConfigPanel,
  NumberFieldConfigPanel,
  SliderFieldConfigPanel,
  TextFieldConfigPanel,
  ImageSelectFieldConfigPanel,
} from '@/features/configure-field';
import { DeleteFieldButton } from '@/features/delete-field';
import type {
  BaseFieldConfig,
  DropdownFieldConfig,
  RadioFieldConfig,
  CheckboxFieldConfig,
  NumberFieldConfig,
  SliderFieldConfig,
  TextFieldConfig,
  ImageSelectFieldConfig,
} from '@/shared/config';

interface FieldEditorWidgetProps {
  field: BaseFieldConfig;
  onUpdate: (updated: BaseFieldConfig) => void;
  onDelete: () => void;
  onUploadImage?: (file: File) => Promise<string>;
}

function noopUploadImage(): Promise<string> {
  return Promise.reject(new Error('Image upload is not configured'));
}

/**
 * Dispatches to type-specific config panels based on field.type.
 * Each panel receives a typed field and an onUpdate callback that upcasts
 * the specific field type back to BaseFieldConfig for the parent.
 */
function renderFieldConfigPanel(
  field: BaseFieldConfig,
  onUpdate: (updated: BaseFieldConfig) => void,
  onUploadImage: (file: File) => Promise<string>,
): React.ReactNode {
  switch (field.type) {
    case 'dropdown':
      return (
        <DropdownFieldConfigPanel
          field={field as DropdownFieldConfig}
          onUpdate={(updated) => onUpdate(updated)}
        />
      );
    case 'radio':
      return (
        <RadioFieldConfigPanel
          field={field as RadioFieldConfig}
          onUpdate={(updated) => onUpdate(updated)}
        />
      );
    case 'checkbox':
      return (
        <CheckboxFieldConfigPanel
          field={field as CheckboxFieldConfig}
          onUpdate={(updated) => onUpdate(updated)}
        />
      );
    case 'number':
      return (
        <NumberFieldConfigPanel
          field={field as NumberFieldConfig}
          onUpdate={(updated) => onUpdate(updated)}
        />
      );
    case 'slider':
      return (
        <SliderFieldConfigPanel
          field={field as SliderFieldConfig}
          onUpdate={(updated) => onUpdate(updated)}
        />
      );
    case 'text':
      return (
        <TextFieldConfigPanel
          field={field as TextFieldConfig}
          onUpdate={(updated) => onUpdate(updated)}
        />
      );
    case 'image_select':
      return (
        <ImageSelectFieldConfigPanel
          field={field as ImageSelectFieldConfig}
          onUpdate={(updated) => onUpdate(updated)}
          onUploadImage={onUploadImage}
        />
      );
  }
}

export function FieldEditorWidget({
  field,
  onUpdate,
  onDelete,
  onUploadImage = noopUploadImage,
}: FieldEditorWidgetProps) {
  return (
    <div>
      {renderFieldConfigPanel(field, onUpdate, onUploadImage)}
      <DeleteFieldButton onDelete={onDelete} />
    </div>
  );
}
