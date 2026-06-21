"use client";

import React, { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="error-wrapper container">
      <div className="glass-panel error-card">
        <h2 className="error-heading">Oops, something went wrong!</h2>
        <p className="error-message">
          We encountered an unexpected error while trying to process your request. Our systems have logged this issue.
        </p>
        <button
          className="btn-primary"
          onClick={() => reset()}
          aria-label="Try again"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
