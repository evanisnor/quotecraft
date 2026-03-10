'use client';

import { useState } from 'react';
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

export interface FieldPreviewRendererProps {
  field: BaseFieldConfig;
  value: number;
  onChange: (value: number) => void;
}

function NumberFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: NumberFieldConfig;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="number"
      id={`field-preview-${field.id}`}
      min={field.min}
      max={field.max}
      step={field.step}
      placeholder={field.placeholder}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

function SliderFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: SliderFieldConfig;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <input
      type="range"
      id={`field-preview-${field.id}`}
      min={field.min}
      max={field.max}
      step={field.step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
    />
  );
}

function TextFieldRenderer({
  field,
  onChange,
}: {
  field: TextFieldConfig;
  onChange: (value: number) => void;
}) {
  const [displayValue, setDisplayValue] = useState('');
  return (
    <input
      type="text"
      id={`field-preview-${field.id}`}
      placeholder={field.placeholder}
      value={displayValue}
      onChange={(e) => {
        setDisplayValue(e.target.value);
        onChange(0);
      }}
    />
  );
}

function DropdownFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: DropdownFieldConfig;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <select
      id={`field-preview-${field.id}`}
      value={value}
      onChange={(e) => {
        const selected = field.options.find(
          (opt) => (parseFloat(opt.value) || 0) === parseFloat(e.target.value),
        );
        onChange(selected !== undefined ? parseFloat(selected.value) || 0 : 0);
      }}
    >
      {field.options.map((opt) => (
        <option key={opt.id} value={parseFloat(opt.value) || 0}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function RadioFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: RadioFieldConfig;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset>
      <legend>{field.label}</legend>
      {field.options.map((opt) => {
        const numericValue = parseFloat(opt.value) || 0;
        return (
          <label key={opt.id}>
            <input
              type="radio"
              name={`field-preview-${field.id}`}
              value={numericValue}
              checked={value === numericValue}
              onChange={() => onChange(numericValue)}
            />
            {opt.label}
          </label>
        );
      })}
    </fieldset>
  );
}

function CheckboxFieldRenderer({
  field,
  onChange,
}: {
  field: CheckboxFieldConfig;
  onChange: (value: number) => void;
}) {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  function handleChange(optionId: string, checked: boolean): void {
    const next = new Set(checkedIds);
    if (checked) {
      next.add(optionId);
    } else {
      next.delete(optionId);
    }
    setCheckedIds(next);
    onChange(next.size);
  }

  return (
    <fieldset>
      <legend>{field.label}</legend>
      {field.options.map((opt) => (
        <label key={opt.id}>
          <input
            type="checkbox"
            name={`${field.id}-${opt.id}-checked`}
            checked={checkedIds.has(opt.id)}
            onChange={(e) => handleChange(opt.id, e.target.checked)}
          />
          {opt.label}
        </label>
      ))}
    </fieldset>
  );
}

function ImageSelectFieldRenderer({
  field,
  value,
  onChange,
}: {
  field: ImageSelectFieldConfig;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset>
      <legend>{field.label}</legend>
      {field.options.map((opt) => {
        const numericValue = parseFloat(opt.value) || 0;
        return (
          <label key={opt.id}>
            <input
              type="radio"
              name={`field-preview-${field.id}`}
              value={numericValue}
              checked={value === numericValue}
              onChange={() => onChange(numericValue)}
            />
            {opt.imageUrl !== '' && <img src={opt.imageUrl} alt={opt.label} />}
            {opt.label}
          </label>
        );
      })}
    </fieldset>
  );
}

export function FieldPreviewRenderer({ field, value, onChange }: FieldPreviewRendererProps) {
  const inputId = `field-preview-${field.id}`;

  function renderInput() {
    switch (field.type) {
      case 'number':
        return (
          <NumberFieldRenderer
            field={field as NumberFieldConfig}
            value={value}
            onChange={onChange}
          />
        );
      case 'slider':
        return (
          <SliderFieldRenderer
            field={field as SliderFieldConfig}
            value={value}
            onChange={onChange}
          />
        );
      case 'text':
        return <TextFieldRenderer field={field as TextFieldConfig} onChange={onChange} />;
      case 'dropdown':
        return (
          <DropdownFieldRenderer
            field={field as DropdownFieldConfig}
            value={value}
            onChange={onChange}
          />
        );
      case 'radio':
        return (
          <RadioFieldRenderer field={field as RadioFieldConfig} value={value} onChange={onChange} />
        );
      case 'checkbox':
        return <CheckboxFieldRenderer field={field as CheckboxFieldConfig} onChange={onChange} />;
      case 'image_select':
        return (
          <ImageSelectFieldRenderer
            field={field as ImageSelectFieldConfig}
            value={value}
            onChange={onChange}
          />
        );
    }
  }

  const isFieldset =
    field.type === 'radio' || field.type === 'checkbox' || field.type === 'image_select';

  return (
    <div>
      {!isFieldset && <label htmlFor={inputId}>{field.label}</label>}
      {renderInput()}
      {field.helpText !== undefined && <small>{field.helpText}</small>}
    </div>
  );
}
