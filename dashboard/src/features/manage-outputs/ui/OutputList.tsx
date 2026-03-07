'use client';

import { useRef, useState } from 'react';
import type { ResultOutputConfig } from '@/shared/config';

interface OutputListProps {
  outputs: ResultOutputConfig[];
  selectedOutputId: string | null;
  onAdd: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (reordered: ResultOutputConfig[]) => void;
}

/**
 * OutputList renders the formula outputs panel: an ordered list of output values
 * with add, delete, and reorder (drag-and-drop + keyboard) support.
 * Selecting an output sets it as active so that the formula editor panel can render.
 */
export function OutputList({
  outputs,
  selectedOutputId,
  onAdd,
  onSelect,
  onDelete,
  onReorder,
}: OutputListProps) {
  const draggingIndex = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  function handleDragStart(e: React.DragEvent<HTMLLIElement>, index: number): void {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
    draggingIndex.current = index;
    setDraggingId(outputs[index].id);
  }

  function handleDragOver(e: React.DragEvent<HTMLLIElement>, targetIndex: number): void {
    e.preventDefault();
    if (draggingIndex.current === null || draggingIndex.current === targetIndex) {
      return;
    }
    const next = [...outputs];
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
      const next = [...outputs];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      onReorder(next);
    } else if (e.key === 'ArrowDown' && index < outputs.length - 1) {
      e.preventDefault();
      const next = [...outputs];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      onReorder(next);
    }
  }

  return (
    <section aria-label="Formula outputs">
      <ul aria-label="Output values">
        {outputs.map((output, index) => (
          <li
            key={output.id}
            draggable
            tabIndex={0}
            data-index={index}
            data-dragging={draggingId === output.id ? 'true' : undefined}
            data-selected={selectedOutputId === output.id ? 'true' : undefined}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            onKeyDown={(e) => handleKeyDown(e, index)}
          >
            <button type="button" onClick={() => onSelect(output.id)}>
              {output.label}
            </button>
            <button
              type="button"
              aria-label={`Delete output ${output.label}`}
              onClick={() => onDelete(output.id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onAdd}>
        Add output
      </button>
    </section>
  );
}
