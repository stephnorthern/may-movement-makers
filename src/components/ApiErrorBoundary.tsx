
import React, { Component, ErrorInfo, ReactNode } from "react";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ApiErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ApiErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ApiErrorBoundary extends Component<ApiErrorBoundaryProps, ApiErrorBoundaryState> {
  constructor(props: ApiErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): ApiErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to an error reporting service
    console.error("Error caught by API Error Boundary:", error, errorInfo);
    
    // You could send this to an error tracking service in production
    // Example: Sentry.captureException(error);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
          <p className="text-gray-600 mb-4 text-center">
            {this.state.error?.message || "An unexpected error occurred while fetching data."}
          </p>
          <Button
            onClick={this.handleReset}
            className="bg-movement-purple hover:bg-movement-dark-purple"
          >
            Try Again
          </Button>
        </div>
      );
    }

    // When there's no error, render children normally
    return this.props.children;
  }
}

export default ApiErrorBoundary;
