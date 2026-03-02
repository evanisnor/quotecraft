'use client';

import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

export interface PreviewPaneProps {
  children?: ReactNode;
}

const CSS_RESET = `
:host {
  all: initial;
  display: block;
  box-sizing: border-box;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}
`;

export function PreviewPane({ children }: PreviewPaneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    // Guard against double-attachment (React StrictMode runs effects twice)
    if (host.shadowRoot) {
      setShadowRoot(host.shadowRoot);
      return;
    }

    const root = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = CSS_RESET;
    root.appendChild(style);

    setShadowRoot(root);

    return () => {
      setShadowRoot(null);
    };
  }, []);

  return (
    <section aria-label="Calculator Preview">
      <div ref={hostRef} data-testid="preview-shadow-host">
        {shadowRoot !== null && createPortal(children, shadowRoot)}
      </div>
    </section>
  );
}
