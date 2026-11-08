import React from 'react';

const Bar = ({ className = '' }) => <div className={`bg-zinc-800 rounded ${className}`} />;

export function UpNextSkeleton({ count = 6 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="flex gap-3 p-2 animate-pulse">
      <div className="w-40 aspect-video bg-zinc-900 rounded-xl border border-zinc-800 shrink-0" />
      <div className="flex-1 space-y-2 pt-1">
        <Bar className="h-3.5 w-11/12" />
        <Bar className="h-3 w-2/3" />
        <Bar className="h-3 w-1/2" />
      </div>
    </div>
  ));
}

export default function WatchSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="max-w-[1700px] mx-auto p-4 lg:p-6"
    >
      <span className="sr-only">Loading video</span>
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-4 lg:grid-rows-[auto_1fr] lg:items-start animate-pulse">
        {/* Player placeholder */}
        <div className="lg:col-span-2 xl:col-span-3">
          <div className="w-full aspect-video bg-zinc-900 rounded-2xl border border-zinc-800" />
        </div>

        {/* Details placeholder */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-4">
          <Bar className="h-7 w-3/4" />
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-zinc-800" />
              <div className="space-y-2">
                <Bar className="h-3.5 w-28" />
                <Bar className="h-3 w-20" />
              </div>
            </div>
            <div className="flex gap-2">
              <Bar className="h-9 w-20 rounded-full" />
              <Bar className="h-9 w-20 rounded-full" />
              <Bar className="h-9 w-28 rounded-full" />
            </div>
          </div>
          <div className="bg-zinc-900/60 rounded-2xl p-4 border border-zinc-800/80 space-y-2">
            <Bar className="h-3 w-40" />
            <Bar className="h-3.5 w-full" />
            <Bar className="h-3.5 w-5/6" />
          </div>
        </div>

        {/* Up Next sidebar placeholder */}
        <div className="space-y-3 lg:col-start-3 xl:col-start-4 lg:row-start-1 lg:row-span-2">
          <Bar className="h-4 w-20" />
          <UpNextSkeleton />
        </div>
      </div>
    </div>
  );
}
