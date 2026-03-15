import { BADGE_TEXT, BADGE_HOMEPAGE_URL } from '@quotecraft/field-renderers';

export function PoweredByBadge() {
  return (
    <a href={BADGE_HOMEPAGE_URL} target="_blank" rel="noopener noreferrer" className="qc-badge">
      {BADGE_TEXT}
    </a>
  );
}
