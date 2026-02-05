'use client';

import * as React from 'react';
import { ErrorFallback } from '@/components/error-boundary';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error:', error);
  }, [error]);

  return <ErrorFallback error={error} onReset={reset} />;
}
