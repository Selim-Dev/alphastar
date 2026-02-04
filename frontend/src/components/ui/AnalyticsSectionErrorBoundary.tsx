import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AnalyticsSectionErrorBoundaryProps {
  children: ReactNode;
  sectionName?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  fallback?: ReactNode;
}

interface AnalyticsSectionErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * AnalyticsSectionErrorBoundary - Specialized error boundary for analytics chart sections
 * 
 * Provides graceful error handling for individual analytics sections without
 * breaking the entire page. Shows a user-friendly error message with retry option.
 * 
 * Usage:
 * ```tsx
 * <AnalyticsSectionErrorBoundary sectionName="Three-Bucket Analysis">
 *   <ThreeBucketChart data={data} />
 * </AnalyticsSectionErrorBoundary>
 * ```
 */
export class AnalyticsSectionErrorBoundary extends Component<
  AnalyticsSectionErrorBoundaryProps,
  AnalyticsSectionErrorBoundaryState
> {
  constructor(props: AnalyticsSectionErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AnalyticsSectionErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AnalyticsSectionErrorBoundary caught an error:', {
      section: this.props.sectionName,
      error,
      errorInfo,
    });

    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="bg-card border border-border rounded-lg p-8">
          <div className="flex flex-col items-center text-center max-w-md mx-auto">
            {/* Error Icon */}
            <div className="w-16 h-16 mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>

            {/* Error Title */}
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {this.props.sectionName
                ? `Unable to Load ${this.props.sectionName}`
                : 'Unable to Load Analytics'}
            </h3>

            {/* Error Message */}
            <p className="text-sm text-muted-foreground mb-1">
              There was an error loading this section. This may be due to:
            </p>
            <ul className="text-xs text-muted-foreground mb-4 text-left list-disc list-inside">
              <li>Network connectivity issues</li>
              <li>Invalid or incomplete data</li>
              <li>Temporary server issues</li>
            </ul>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="w-full mb-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-muted rounded text-xs font-mono overflow-auto max-h-32">
                  <p className="text-destructive font-semibold mb-1">
                    {this.state.error.name}: {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-muted-foreground whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleRefreshPage}
                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium"
              >
                Refresh Page
              </button>
            </div>

            {/* Help Text */}
            <p className="text-xs text-muted-foreground mt-4">
              If the problem persists, please contact support or try again later.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * AnalyticsSectionErrorFallback - Functional component for custom error fallback
 * 
 * Can be used as a custom fallback prop for AnalyticsSectionErrorBoundary
 */
export function AnalyticsSectionErrorFallback({
  sectionName,
  error,
  onRetry,
}: {
  sectionName?: string;
  error?: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-card border border-destructive/20 rounded-lg p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground mb-1">
            {sectionName ? `${sectionName} Error` : 'Section Error'}
          </h4>
          <p className="text-xs text-muted-foreground mb-3">
            {error?.message || 'An unexpected error occurred while loading this section.'}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * withAnalyticsErrorBoundary - HOC to wrap components with error boundary
 * 
 * Usage:
 * ```tsx
 * const SafeChart = withAnalyticsErrorBoundary(MyChart, 'My Chart');
 * ```
 */
export function withAnalyticsErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  sectionName?: string
) {
  return function WrappedComponent(props: P) {
    return (
      <AnalyticsSectionErrorBoundary sectionName={sectionName}>
        <Component {...props} />
      </AnalyticsSectionErrorBoundary>
    );
  };
}
