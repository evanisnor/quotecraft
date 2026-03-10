'use client';

import { useRef, useState } from 'react';
import type { BaseFieldConfig, ImageSelectFieldConfig, ImageSelectOption } from '@/shared/config';
import { generateId } from '@/shared/lib';
import { FieldConfigPanel } from './FieldConfigPanel';

interface ImageSelectFieldConfigPanelProps {
  field: ImageSelectFieldConfig;
  onUpdate: (updated: ImageSelectFieldConfig) => void;
  onUploadImage: (file: File) => Promise<string>;
}

interface ImageOptionEditorProps {
  option: ImageSelectOption;
  index: number;
  onLabelChange: (label: string) => void;
  onValueChange: (value: string) => void;
  onRemove: () => void;
  onUploadImage: (file: File) => Promise<string>;
  onImageUrlChange: (url: string) => void;
}

function ImageOptionEditor({
  option,
  index,
  onLabelChange,
  onValueChange,
  onRemove,
  onUploadImage,
  onImageUrlChange,
}: ImageOptionEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function handleUploadClick(): void {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      const url = await onUploadImage(file);
      onImageUrlChange(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    }
  }

  return (
    <div>
      <label htmlFor={`image-option-label-${index}`}>Label</label>
      <input
        id={`image-option-label-${index}`}
        type="text"
        value={option.label}
        onChange={(e) => onLabelChange(e.target.value)}
      />

      <label htmlFor={`image-option-value-${index}`}>Value</label>
      <input
        id={`image-option-value-${index}`}
        type="text"
        value={option.value}
        onChange={(e) => onValueChange(e.target.value)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <button type="button" onClick={handleUploadClick}>
        Upload image
      </button>

      {option.imageUrl !== '' && <img src={option.imageUrl} alt={option.label} />}

      {uploadError !== null && <p role="alert">{uploadError}</p>}

      <button type="button" onClick={onRemove}>
        Remove
      </button>
    </div>
  );
}

export function ImageSelectFieldConfigPanel({
  field,
  onUpdate,
  onUploadImage,
}: ImageSelectFieldConfigPanelProps) {
  function handleBaseUpdate(updatedBase: BaseFieldConfig): void {
    onUpdate({ ...updatedBase, type: 'image_select', options: field.options });
  }

  function handleLabelChange(index: number, label: string): void {
    const updated = field.options.map((opt, i) => (i === index ? { ...opt, label } : opt));
    onUpdate({ ...field, options: updated });
  }

  function handleValueChange(index: number, value: string): void {
    const updated = field.options.map((opt, i) => (i === index ? { ...opt, value } : opt));
    onUpdate({ ...field, options: updated });
  }

  function handleImageUrlChange(index: number, imageUrl: string): void {
    const updated = field.options.map((opt, i) => (i === index ? { ...opt, imageUrl } : opt));
    onUpdate({ ...field, options: updated });
  }

  function handleRemove(index: number): void {
    const updated = field.options.filter((_, i) => i !== index);
    onUpdate({ ...field, options: updated });
  }

  function handleAddOption(): void {
    const newOption: ImageSelectOption = {
      id: generateId(),
      label: '',
      value: '',
      imageUrl: '',
    };
    onUpdate({ ...field, options: [...field.options, newOption] });
  }

  return (
    <div>
      <FieldConfigPanel field={field} onUpdate={handleBaseUpdate} />

      {field.options.map((option, index) => (
        <ImageOptionEditor
          key={option.id}
          option={option}
          index={index}
          onLabelChange={(label) => handleLabelChange(index, label)}
          onValueChange={(value) => handleValueChange(index, value)}
          onRemove={() => handleRemove(index)}
          onUploadImage={onUploadImage}
          onImageUrlChange={(url) => handleImageUrlChange(index, url)}
        />
      ))}

      <button type="button" onClick={handleAddOption}>
        Add option
      </button>
    </div>
  );
}
