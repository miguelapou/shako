import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * ErrorBoundary component to catch React rendering errors
 *
 * Wraps the application to gracefully handle unexpected errors
 * and prevent the entire app from crashing
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Optionally reload the page for a fresh start
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      const darkMode = document.documentElement.classList.contains('dark');

      return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${
          darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
          <div className={`max-w-md w-full rounded-lg shadow-xl p-8 text-center ${
            darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <div className="flex justify-center mb-4">
              <AlertTriangle className={`w-16 h-16 ${
                darkMode ? 'text-red-400' : 'text-red-600'
              }`} />
            </div>

            <h1 className={`text-2xl font-bold mb-2 ${
              darkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              Something Went Wrong
            </h1>

            <p className={`mb-6 ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-md transition-colors font-medium w-full justify-center"
            >
              <RefreshCw className="w-5 h-5" />
              Reload Application
            </button>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={`mt-6 text-left ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <summary className="cursor-pointer font-semibold mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className={`text-xs overflow-auto p-4 rounded ${
                  darkMode ? 'bg-gray-900' : 'bg-gray-100'
                }`}>
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
