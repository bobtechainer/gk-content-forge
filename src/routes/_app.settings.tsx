import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Cài đặt — GK Studio" }] }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto max-w-[1440px] space-y-6 p-6 md:p-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Cài đặt</h1>
      <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
        Trang cài đặt sẽ được hoàn thiện ở phiên bản tiếp theo.
      </div>
    </div>
  );
}