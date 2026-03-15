export const BADGE_TEXT = 'Powered by QuoteCraft';
export const BADGE_HOMEPAGE_URL = 'https://quotecraft.io';

export function badgeHtml(): string {
  return `<a href="${BADGE_HOMEPAGE_URL}" target="_blank" rel="noopener noreferrer" class="qc-badge">${BADGE_TEXT}</a>`;
}
