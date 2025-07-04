export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gray-50">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500 mb-4"></div>
        <h2 className="text-xl font-semibold text-amber-700">Loading...</h2>
        <p className="text-gray-600 mt-2">Brewing up your content</p>
      </div>
    </div>
  );
}
