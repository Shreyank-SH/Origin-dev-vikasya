export function PostSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4 animate-pulse">
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-full bg-sage-200" />
        <div className="space-y-2">
          <div className="h-4 w-24 bg-sage-200 rounded" />
          <div className="h-3 w-16 bg-sage-200 rounded" />
        </div>
      </div>
      <div className="h-20 bg-sage-200 rounded" />
    </div>
  );
}