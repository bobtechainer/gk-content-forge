import { createFileRoute } from "@tanstack/react-router";
import { CourseBuilder } from "@/components/course/course-builder";

export const Route = createFileRoute("/creator/builder/course/$id")({
  head: () => ({ meta: [{ title: "Soạn khóa học — GK Studio" }] }),
  component: CreatorCourseBuilder,
});

function CreatorCourseBuilder() {
  const { id } = Route.useParams();
  return <CourseBuilder courseId={id} backTo="/creator/dashboard" />;
}
