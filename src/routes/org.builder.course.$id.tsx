import { createFileRoute } from "@tanstack/react-router";
import { CourseBuilder } from "@/components/course/course-builder";

export const Route = createFileRoute("/org/builder/course/$id")({
  head: () => ({ meta: [{ title: "Soạn khóa học — GK Studio" }] }),
  component: OrgCourseBuilder,
});

function OrgCourseBuilder() {
  const { id } = Route.useParams();
  return <CourseBuilder courseId={id} backTo="/org/dashboard" />;
}
