import { Suspense } from "react";
import { CourseBack, CourseDetail } from "./course-detail";

export default function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto max-w-6xl rounded-3xl bg-white p-4 sm:p-6">
        <CourseBack />
        <Suspense fallback={<p className="mt-4 text-sm text-ink-600">Loading course…</p>}>
          <CourseDetail params={params} />
        </Suspense>
      </div>
    </div>
  );
}
