"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
}

/**
 * Reusable error boundary that catches render errors in individual
 * dashboard panels without crashing the entire page.
 */
export default class ErrorBoundaryPanel extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Panel error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel" role="alert">
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "2rem 0" }}>
            {this.props.fallbackMessage || "This panel encountered an error. Please try refreshing."}
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
