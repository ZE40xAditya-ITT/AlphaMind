import React from 'react';

interface LoadingSpinnerProps {
  fullPage?: boolean;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullPage = false, message = "Loading..." }) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      {/* Animated Spinner Ring */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-300 dark:border-slate-700/60"></div>
        <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-secondary animate-spin"></div>
      </div>
      <p className="text-slate-600 dark:text-slate-400 font-medium tracking-wide animate-pulse">{message}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
