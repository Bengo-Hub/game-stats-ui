import * as React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
}

/**
 * Visually hides content while keeping it accessible to screen readers.
 * Use for providing context to assistive technologies.
 */
export function VisuallyHidden({ children }: VisuallyHiddenProps) {
  return <span className="sr-only">{children}</span>;
}

export default VisuallyHidden;
