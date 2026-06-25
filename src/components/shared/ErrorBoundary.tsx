import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in CampuSync application:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-foreground">
          <div className="max-w-md w-full p-8 border border-border bg-card rounded-2xl shadow-xl flex flex-col items-center text-center space-y-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-primary">Unexpected Error</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                An unexpected component crash occurred. The system has logged the event and is ready to recover.
              </p>
            </div>
            
            <div className="w-full pt-2">
              <Button 
                onClick={this.handleReset}
                className="w-full font-bold bg-primary hover:bg-primary/95 flex items-center justify-center gap-2 py-5 rounded-xl shadow-md"
              >
                <RefreshCw className="w-4 h-4 animate-spin-hover" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
