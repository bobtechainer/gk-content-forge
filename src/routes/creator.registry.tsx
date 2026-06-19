import { createFileRoute } from "@tanstack/react-router";
import { TeacherRegistryPage } from "@/components/creator/teacher-registry";

export const Route = createFileRoute("/creator/registry")({
  head: () => ({ meta: [{ title: "Hồ sơ chuyên môn số — GK Content Studio" }] }),
  component: TeacherRegistryPage,
});
