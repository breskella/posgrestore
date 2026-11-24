import { Component } from "react";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled application error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-base-200 px-4 py-12">
          <section className="card w-full max-w-lg border border-base-300 bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <div className="rounded-full bg-error/10 p-4 text-error">
                <AlertTriangleIcon className="size-9" />
              </div>
              <h1 className="card-title mt-2 text-2xl">Something went wrong</h1>
              <p className="text-base-content/70">
                The page ran into an unexpected problem. Reload to try again.
              </p>
              <button
                type="button"
                className="btn btn-primary mt-3 gap-2"
                onClick={() => window.location.reload()}
              >
                <RefreshCwIcon className="size-4" />
                Reload Page
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
