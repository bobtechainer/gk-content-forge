import type { ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface ActivityEntry {
  id: string;
  icon: ComponentType<{ className?: string }>;
  text: string;
  time: string;
  color: string;
}

export function ActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoạt động gần đây</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có hoạt động nào.</p>
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-5">
            {entries.map((entry) => {
              const Icon = entry.icon;
              return (
                <li key={entry.id} className="relative">
                  <span
                    className="absolute -left-[1.65rem] flex h-6 w-6 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: entry.color }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <p className="text-sm text-foreground">{entry.text}</p>
                  <p className="text-xs text-muted-foreground">{entry.time}</p>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
