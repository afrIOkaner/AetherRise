/**
 * @file page.tsx (Offline)
 * @description Simple fallback page when user has no internet.
 */
export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white p-8 text-center">
      <h1 className="text-2xl font-black text-blue-600 mb-4 uppercase">You are Offline</h1>
      <p className="text-gray-500 font-bold">Please check your connection to use AetherRise.</p>
    </div>
  );
}