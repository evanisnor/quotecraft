'use client';

import { useEffect, useRef, useState } from 'react';

interface DeleteFieldButtonProps {
  onDelete: () => void;
}

export function DeleteFieldButton({ onDelete }: DeleteFieldButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!confirming) return;

    dialogRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setConfirming(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [confirming]);

  if (confirming) {
    return (
      <div
        ref={dialogRef}
        role="dialog"
        aria-label="Confirm field deletion"
        aria-modal="true"
        tabIndex={-1}
      >
        <span>Are you sure?</span>
        <button
          type="button"
          onClick={() => {
            onDelete();
            setConfirming(false);
          }}
        >
          Confirm
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            triggerRef.current?.focus();
          }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => {
        setConfirming(true);
      }}
    >
      Delete field
    </button>
  );
}
