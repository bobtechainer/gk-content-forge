import { createFileRoute } from "@tanstack/react-router";
import { ContentTable } from "@/components/content-table";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";

export const Route = createFileRoute("/_app/materials")({
  head: () => ({ meta: [{ title: "Học liệu — GK Studio" }] }),
  component: Page,
});

function Page() {
  const items = useContent((s) => s.items);
  const roleId = useSession((s) => s.roleId);
  const list = items.filter(
    (i) => i.type === "material" && (roleId === "admin" || i.ownerId === roleId),
  );
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-6 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Học liệu</h1>
      <ContentTable items={list} />
    </div>
  );
}