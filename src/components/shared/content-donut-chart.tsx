import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MATERIAL_TYPE_LABELS } from "@/lib/taxonomy";
import type { ContentItem, MaterialType } from "@/lib/types";
import { MATERIAL_TYPE_ACCENT } from "./material-type-icon";

function resolveType(item: ContentItem): MaterialType {
  if (item.category === "book") return "book";
  if (item.category === "course") return "course";
  return item.materialSubtype ?? "document";
}

export function ContentDonutChart({ items }: { items: ContentItem[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const data = useMemo(() => {
    const counts = new Map<MaterialType, number>();
    for (const item of items) {
      const key = resolveType(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([type, value]) => ({
        type,
        name: MATERIAL_TYPE_LABELS[type],
        value,
        color: MATERIAL_TYPE_ACCENT[type],
      }))
      .sort((a, b) => b.value - a.value);
  }, [items]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bổ nội dung</CardTitle>
        <CardDescription>Theo loại học liệu ({total} mục)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="relative h-44 w-44 shrink-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={2}
                    animationDuration={600}
                  >
                    {data.map((d) => (
                      <Cell key={d.type} fill={d.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="h-full w-full rounded-full" />
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{total}</span>
              <span className="text-xs text-muted-foreground">học liệu</span>
            </div>
          </div>
          <ul className="grid flex-1 grid-cols-1 gap-1.5 sm:grid-cols-2">
            {data.map((d) => (
              <li key={d.type} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="flex-1 truncate text-muted-foreground">{d.name}</span>
                <span className="font-medium text-foreground">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
