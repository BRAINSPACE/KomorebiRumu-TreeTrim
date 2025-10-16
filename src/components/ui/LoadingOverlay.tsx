import React from 'react';

interface LoadingOverlayProps {
  text?: string;
}

export function LoadingOverlay({ text = 'Laddar...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/80 backdrop-blur-sm" data-testid="overlay-loading">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" data-testid="spinner-loading" />
        <p className="text-sm font-medium text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
