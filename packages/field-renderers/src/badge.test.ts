import { BADGE_TEXT, BADGE_HOMEPAGE_URL, badgeHtml } from './badge';

describe('badge constants', () => {
  it('BADGE_TEXT equals "Powered by QuoteCraft"', () => {
    expect(BADGE_TEXT).toBe('Powered by QuoteCraft');
  });

  it('BADGE_HOMEPAGE_URL equals "https://quotecraft.io"', () => {
    expect(BADGE_HOMEPAGE_URL).toBe('https://quotecraft.io');
  });
});

describe('badgeHtml()', () => {
  it('returns a string containing the homepage URL', () => {
    expect(badgeHtml()).toContain('https://quotecraft.io');
  });

  it('returns a string containing the badge text', () => {
    expect(badgeHtml()).toContain('Powered by QuoteCraft');
  });

  it('returns a string with target="_blank"', () => {
    expect(badgeHtml()).toContain('target="_blank"');
  });

  it('returns a string with rel="noopener noreferrer"', () => {
    expect(badgeHtml()).toContain('rel="noopener noreferrer"');
  });

  it('returns a string with class="qc-badge"', () => {
    expect(badgeHtml()).toContain('class="qc-badge"');
  });
});
