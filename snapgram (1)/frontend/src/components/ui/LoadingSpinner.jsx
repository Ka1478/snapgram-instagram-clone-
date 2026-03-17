export default function LoadingSpinner({ fullScreen = false, size = "md" }) {
  const sizeMap = { sm: "w-5 h-5", md: "w-8 h-8", lg: "w-12 h-12" };

  const spinner = (
    <div className={`${sizeMap[size]} border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin`} />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8">
      {spinner}
    </div>
  );
}
