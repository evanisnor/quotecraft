import type { SaveStatus } from '../model/useAutoSave';

const STATUS_LABELS: Record<SaveStatus, string> = {
  idle: '',
  saving: 'Saving...',
  saved: 'Saved',
  error: 'Error saving',
};

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  onSave: () => void;
}

/**
 * SaveStatusIndicator displays the current auto-save state and provides a
 * manual Save button as a fallback. Rendered by EditorPage alongside the
 * calculator config form.
 */
export function SaveStatusIndicator({ status, onSave }: SaveStatusIndicatorProps) {
  const label = STATUS_LABELS[status];

  return (
    <div role="status" aria-live="polite" aria-label="Save status">
      {label !== '' && <span>{label}</span>}
      {status === 'error' && (
        <span role="alert">Could not save changes. Check your connection.</span>
      )}
      <button type="button" onClick={onSave} aria-label="Save">
        Save
      </button>
    </div>
  );
}
