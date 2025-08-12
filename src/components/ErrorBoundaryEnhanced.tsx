import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableFallbackMode?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  fallbackMode: 'simple' | 'safe' | 'minimal';
  retryCount: number;
}

/**
 * Enhanced ErrorBoundary with multiple fallback modes and recovery options
 * Provides graceful degradation for different types of errors
 */
class ErrorBoundaryEnhanced extends Component<Props, State> {
  private retryTimer: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      fallbackMode: 'simple',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Determine fallback mode based on error type
    let fallbackMode: 'simple' | 'safe' | 'minimal' = 'simple';
    
    if (error.message.includes('Canvas') || error.message.includes('WebGL')) {
      fallbackMode = 'safe'; // Canvas/WebGL errors - use CSS fallback
    } else if (error.message.includes('Memory') || error.message.includes('Performance')) {
      fallbackMode = 'minimal'; // Performance issues - minimal mode
    }

    return { 
      hasError: true, 
      error,
      fallbackMode
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo);
    }
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real app, this would send to an error tracking service
    console.log('Logging error to service:', {
      error: error.toString(),
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  private handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < 3) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1
      });
    } else {
      // Too many retries, reload the page
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private renderSimpleFallback = () => (
    <div 
      className="error-boundary-simple" 
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
        fontFamily: 'Courier New, Monaco, Consolas, monospace',
        textAlign: 'center'
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 'normal' }}>
        Screensaver Error
      </h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', maxWidth: '600px', lineHeight: 1.5 }}>
        The screensaver encountered an error. You can try to recover or reload the application.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          onClick={this.handleRetry}
          disabled={this.state.retryCount >= 3}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: this.state.retryCount >= 3 ? '#666' : '#00ff00',
            color: '#0a0a0a',
            border: 'none',
            borderRadius: '4px',
            cursor: this.state.retryCount >= 3 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Retry ({3 - this.state.retryCount} left)
        </button>
        <button
          onClick={this.handleReload}
          style={{
            padding: '0.75rem 1.5rem',
            fontSize: '1rem',
            backgroundColor: '#ff6600',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          Reload Page
        </button>
      </div>
      <details style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '80vw' }}>
        <summary style={{ cursor: 'pointer', fontSize: '1rem', marginBottom: '1rem' }}>
          Technical Details
        </summary>
        <pre style={{ 
          padding: '1rem', 
          backgroundColor: '#1a1a1a', 
          borderRadius: '4px',
          overflow: 'auto',
          fontSize: '0.9rem',
          lineHeight: 1.4
        }}>
          {this.state.error?.toString()}
          {this.state.errorInfo?.componentStack}
        </pre>
      </details>
    </div>
  );

  private renderSafeFallback = () => (
    <div 
      className="error-boundary-safe" 
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: '#000',
        color: '#0f0',
        fontFamily: 'monospace',
        textAlign: 'center',
        background: 'linear-gradient(45deg, #001100, #002200)'
      }}
    >
      <div style={{ 
        fontSize: '3rem', 
        marginBottom: '2rem',
        animation: 'pulse 2s infinite'
      }}>
        🖥️
      </div>
      <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>
        Safe Mode Active
      </h1>
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem', maxWidth: '500px' }}>
        Canvas rendering failed. Running in CSS-only safe mode.
      </p>
      <div style={{
        width: '300px',
        height: '200px',
        border: '2px solid #0f0',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '2rem',
        background: 'repeating-linear-gradient(90deg, transparent, transparent 10px, #0f0 10px, #0f0 11px)'
      }}>
        <div style={{ fontSize: '1.5rem' }}>ASCII ART SIMULATION</div>
      </div>
      <button
        onClick={this.handleReload}
        style={{
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          backgroundColor: '#0f0',
          color: '#000',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      >
        Try Full Mode Again
      </button>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );

  private renderMinimalFallback = () => (
    <div 
      className="error-boundary-minimal" 
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '1rem',
        backgroundColor: '#000',
        color: '#fff',
        fontFamily: 'monospace',
        textAlign: 'center'
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        Minimal Mode
      </h1>
      <p style={{ fontSize: '1rem', marginBottom: '2rem', maxWidth: '400px' }}>
        Performance issues detected. Running in minimal resource mode.
      </p>
      <div style={{
        padding: '2rem',
        border: '1px solid #333',
        borderRadius: '4px',
        marginBottom: '2rem'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>💻</div>
        <div>Basic screensaver mode active</div>
      </div>
      <button
        onClick={this.handleReload}
        style={{
          padding: '0.5rem 1rem',
          fontSize: '0.9rem',
          backgroundColor: '#333',
          color: '#fff',
          border: '1px solid #666',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      >
        Reload
      </button>
    </div>
  );

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Choose fallback based on error type
      switch (this.state.fallbackMode) {
        case 'safe':
          return this.renderSafeFallback();
        case 'minimal':
          return this.renderMinimalFallback();
        default:
          return this.renderSimpleFallback();
      }
    }

    return this.props.children;
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }
}

export default ErrorBoundaryEnhanced;
