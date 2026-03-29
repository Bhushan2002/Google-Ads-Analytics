import { Suspense } from "react";
import Dashboard from "./(dashboard)/page";

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50/70 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <Dashboard />
    </Suspense>
  );
}
