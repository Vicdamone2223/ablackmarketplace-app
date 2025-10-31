// src/components/PageShell.jsx
import React from 'react';

/**
 * PageShell
 * Wrap each screen's content with this, so any internal scroll area
 * reserves space for the fixed BottomNav (and you never get overlap).
 *
 * Usage:
 *   <PageShell>
 *     ...your page content...
 *   </PageShell>
 */
const PageShell = ({ children, className = '' }) => {
  return (
    <main className={`page-scroll ${className}`}>
      {children}
    </main>
  );
};

export default PageShell;
