'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to console
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
}

// Check if current path is a public route
function isPublicRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const publicPaths = ['/discover', '/live', '/leaderboards', '/directory', '/events'];
  const pathname = window.location.pathname;
  return publicPaths.some(path => pathname.startsWith(path)) || pathname === '/';
}

export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development';
  const isPublic = isPublicRoute();
  const homeUrl = isPublic ? '/' : '/dashboard';
  const homeLabel = isPublic ? 'Back Home' : 'Go to Dashboard';

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Our team has been notified.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDev && error && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <Bug className="h-4 w-4" />
                Error Details (Dev Only)
              </div>
              <p className="text-xs text-destructive font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={onReset} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.href = homeUrl}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              {homeLabel}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            If this problem persists, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook version for function components
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((err: Error) => {
    setError(err);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    if (error) {
      console.error('Error caught by useErrorHandler:', error);
    }
  }, [error]);

  return { error, handleError, clearError };
}

export default ErrorBoundary;
