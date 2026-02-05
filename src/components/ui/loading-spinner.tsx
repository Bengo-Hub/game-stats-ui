import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  default: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function LoadingSpinner({ size = 'default', className }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn('animate-spin text-muted-foreground', sizeClasses[size], className)}
      aria-label="Loading"
    />
  );
}

interface FullPageLoaderProps {
  message?: string;
}

export function FullPageLoader({ message = 'Loading...' }: FullPageLoaderProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm z-50"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
}

export function LoadingOverlay({ isLoading, children, className }: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg"
          role="status"
          aria-live="polite"
        >
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}

export default LoadingSpinner;
