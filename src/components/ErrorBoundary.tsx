import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'An unexpected rendering error occurred.',
    };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('BOUNCEBACK Runtime Error:', error, info);
  }

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className="fixed inset-0 bg-[#0e1116] text-[#e6e9ef] flex items-center justify-center p-6"
      >
        <div className="hud-panel rounded-lg max-w-md w-full p-7">
          <div className="text-xs font-mono-num tracking-[0.2em] text-[#ef4444] uppercase">
            RECOVERY MODE
          </div>
          <h1 className="font-display text-2xl font-bold text-white mt-1">
            BOUNCEBACK ENCOUNTERED AN ERROR
          </h1>
          <p className="text-sm text-[#b5becb] mt-2 leading-relaxed">
            {this.state.errorMessage}
          </p>
          <p className="text-xs text-[#8f9aa8] mt-3">
            Your browser-local progress is preserved. Reload to resume the game.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 py-2.5 px-4 bg-[#e59a3c] hover:bg-[#eda951] text-[#0e1116] font-display font-bold text-xs tracking-wider rounded cursor-pointer"
            >
              RELOAD GAME
            </button>
          </div>
        </div>
      </div>
    );
  }
}
