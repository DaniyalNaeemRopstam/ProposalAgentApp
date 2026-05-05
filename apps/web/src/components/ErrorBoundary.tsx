"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Btn } from "@/components/ui/Btn";

type Props = { children: ReactNode };

type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="font-display text-xl font-bold text-text">Something went wrong</div>
          <p className="max-w-md text-sm text-textMuted">
            This part of the app hit an unexpected error. You can try loading it again.
          </p>
          {process.env.NODE_ENV === "development" && this.state.error ? (
            <pre className="max-h-40 max-w-full overflow-auto rounded-lg border border-border bg-surface p-3 text-left text-[11px] text-danger">
              {this.state.error.message}
            </pre>
          ) : null}
          <Btn type="button" onClick={this.handleReset}>
            Try again
          </Btn>
        </div>
      );
    }

    return this.props.children;
  }
}
