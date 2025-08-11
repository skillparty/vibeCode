import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('ScreensaverApp Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div 
          className="error-boundary-fallback" 
          role="alert" 
          aria-live="assertive"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '2rem',
            backgroundColor: '#0a0a0a',
            color: '#00ff00',
            fontFamily: 'monospace',
            textAlign: 'center'
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            ⚠️ Screensaver Error
          </h1>
          <p style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '600px' }}>
            The screensaver encountered an unexpected error. The application has been reset to a safe state.
          </p>
          <details style={{ marginBottom: '2rem', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontSize: '1.1rem' }}>
              Error Details (Click to expand)
            </summary>
            <pre style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              backgroundColor: '#1a1a1a', 
              borderRadius: '4px',
              overflow: 'auto',
              maxWidth: '80vw'
            }}>
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              fontSize: '1rem',
              backgroundColor: '#00ff00',
              color: '#0a0a0a',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'monospace'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
