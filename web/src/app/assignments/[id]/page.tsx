import { Suspense } from "react";
import { AssignmentBack, AssignmentDetail } from "./assignment-detail";

export default function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-4xl rounded-3xl bg-white p-4 sm:p-6">
        <AssignmentBack />
        <Suspense fallback={<p className="mt-4 text-sm text-ink-600">Loading assignment…</p>}>
          <AssignmentDetail params={params} />
        </Suspense>
      </div>
    </div>
  );
}
