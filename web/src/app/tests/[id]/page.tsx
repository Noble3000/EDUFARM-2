import { Suspense } from "react";
import { TestBack, TestRunner } from "./test-runner";

export default function TestPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-4 sm:p-6">
        <TestBack />
        <Suspense fallback={<p className="mt-4 text-sm text-ink-600">Loading test…</p>}>
          <TestRunner params={params} />
        </Suspense>
      </div>
    </div>
  );
}
