import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center">
          <div className="bg-card border border-border rounded-lg p-8 max-w-md text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-destructive"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Something went wrong
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional error display component for query errors
interface ErrorDisplayProps {
  error: Error | null;
  message?: string;
  onRetry?: () => void;
}

export function ErrorDisplay({ error, message, onRetry }: ErrorDisplayProps) {
  if (!error) return null;

  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-destructive"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-destructive">
            {message || 'An error occurred'}
          </p>
          <p className="text-xs text-destructive/80 mt-1">
            {error.message}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex-shrink-0 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 rounded transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// Empty state component
interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title = 'No data found',
  description = 'There is no data to display for the selected filters.',
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {icon || (
        <div className="w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
