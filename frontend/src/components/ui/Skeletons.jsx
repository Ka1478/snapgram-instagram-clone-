export function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-neutral-900 md:rounded-xl md:border border-gray-200 dark:border-gray-800 mb-4 animate-pulse">
      <div className="flex items-center gap-3 px-3 py-3">
        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        </div>
      </div>
      <div className="w-full h-64 bg-gray-200 dark:bg-gray-700" />
      <div className="px-3 py-3 space-y-2">
        <div className="flex gap-4">
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-6 p-4">
        <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" />
          <div className="flex gap-4">
            {[1,2,3].map(i => <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />)}
          </div>
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-56" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-0.5 px-0.5">
        {Array.from({length:9}).map((_,i) => <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700" />)}
      </div>
    </div>
  );
}

export function StorySkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      {Array.from({length:6}).map((_,i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-2.5 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      ))}
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="space-y-1 animate-pulse">
      {Array.from({length:5}).map((_,i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
          </div>
          <div className="w-10 h-10 rounded-md bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ count = 12 }) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {Array.from({length:count}).map((_,i) => (
        <div key={i} className="aspect-square bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ))}
    </div>
  );
}
