'use client';

import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { BaseFieldConfig } from '@/shared/config';

interface DraggableFieldListProps {
  fields: BaseFieldConfig[];
  onReorder: (reordered: BaseFieldConfig[]) => void;
  renderField: (field: BaseFieldConfig) => ReactNode;
}

export function DraggableFieldList({ fields, onReorder, renderField }: DraggableFieldListProps) {
  const draggingIndex = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDragStart(e: React.DragEvent<HTMLLIElement>, index: number): void {
    // e.dataTransfer is non-nullable per React's type definition, but jsdom's
    // fireEvent.dragStart does not populate it — guard required for test compatibility.
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
    draggingIndex.current = index;
    setDraggingId(fields[index].id);
  }

  function handleDragOver(e: React.DragEvent<HTMLLIElement>, targetIndex: number): void {
    e.preventDefault();
    if (draggingIndex.current === null || draggingIndex.current === targetIndex) {
      return;
    }
    const next = [...fields];
    const [item] = next.splice(draggingIndex.current, 1);
    next.splice(targetIndex, 0, item);
    draggingIndex.current = targetIndex;
    onReorder(next);
  }

  function handleDrop(e: React.DragEvent<HTMLLIElement>): void {
    e.preventDefault();
  }

  function handleDragEnd(): void {
    draggingIndex.current = null;
    setDraggingId(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLLIElement>, index: number): void {
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const next = [...fields];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      onReorder(next);
    } else if (e.key === 'ArrowDown' && index < fields.length - 1) {
      e.preventDefault();
      const next = [...fields];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      onReorder(next);
    }
  }

  return (
    <ul>
      {fields.map((field, index) => (
        <li
          key={field.id}
          draggable
          tabIndex={0}
          data-index={index}
          data-dragging={draggingId === field.id ? 'true' : undefined}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onKeyDown={(e) => handleKeyDown(e, index)}
        >
          {renderField(field)}
        </li>
      ))}
    </ul>
  );
}
