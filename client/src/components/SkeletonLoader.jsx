import React from 'react';

export default function SkeletonLoader({ type = 'card', className = '' }) {
  const baseClasses = 'skeleton-shimmer rounded-xl overflow-hidden';

  if (type === 'gauge') {
    return (
      <div className={`glass-card p-5 flex flex-col items-center relative overflow-hidden ${className}`}>
        <div className={`w-24 h-4 mb-4 ${baseClasses}`} />
        <div className={`w-32 h-32 rounded-full mb-4 ${baseClasses}`} />
        <div className={`w-full h-1 mt-4 ${baseClasses}`} />
      </div>
    );
  }

  if (type === 'chart') {
    return (
      <div className={`h-full w-full flex flex-col gap-4 ${className}`}>
        <div className="flex justify-between items-center mb-2">
          <div className={`w-32 h-5 ${baseClasses}`} />
          <div className={`w-24 h-6 ${baseClasses}`} />
        </div>
        <div className="flex gap-2 mb-2">
           <div className={`w-16 h-6 rounded-full ${baseClasses}`} />
           <div className={`w-16 h-6 rounded-full ${baseClasses}`} />
           <div className={`w-16 h-6 rounded-full ${baseClasses}`} />
        </div>
        <div className={`flex-1 w-full rounded-lg ${baseClasses}`} />
      </div>
    );
  }

  if (type === 'badge') {
    return (
      <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl border border-surface-800/50 bg-surface-900/30 ${className}`}>
        <div className={`w-6 h-6 rounded-full ${baseClasses}`} />
        <div>
          <div className={`w-16 h-4 mb-1 ${baseClasses}`} />
          <div className={`w-20 h-2 ${baseClasses}`} />
        </div>
      </div>
    );
  }

  // Default 'card'
  return (
    <div className={`glass-card p-5 ${className}`}>
      <div className={`w-1/3 h-5 mb-4 ${baseClasses}`} />
      <div className={`w-full h-4 mb-2 ${baseClasses}`} />
      <div className={`w-5/6 h-4 mb-2 ${baseClasses}`} />
      <div className={`w-4/6 h-4 ${baseClasses}`} />
    </div>
  );
}
