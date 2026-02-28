'use client';

interface DeleteConfirmDialogProps {
  calculatorId: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  calculatorId: _calculatorId,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  return (
    <div role="dialog" aria-label="Confirm deletion">
      <p>Delete this calculator? This cannot be undone.</p>
      <button type="button" onClick={onConfirm}>
        Delete
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
