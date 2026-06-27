import { Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getResolvedThemeVars } from "@/lib/theme/resolve";
import type { CourseTheme } from "@/lib/theme/resolve";
import type React from "react";

interface CertificateProps {
  courseTitle: string;
  learnerName?: string;
  theme?: CourseTheme;
}

export function Certificate({
  courseTitle,
  learnerName = "Học sinh",
  theme,
}: CertificateProps) {
  const themeVars = getResolvedThemeVars(theme) as React.CSSProperties;
  const completionDate = new Date().toLocaleDateString("vi-VN");

  return (
    <div data-course-theme style={themeVars}>
      {/* In chứng nhận button — ẩn khi in */}
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          className="no-print"
          onClick={() => window.print()}
          aria-label="In chứng nhận"
        >
          <Award className="mr-1.5 h-4 w-4" />
          In chứng nhận
        </Button>
      </div>

      {/* Nội dung chứng nhận — hiển thị khi in */}
      <div
        className="print-content rounded-xl border-2 p-8 text-center"
        style={{
          borderColor: "var(--course-accent, var(--primary))",
          backgroundColor: "var(--course-surface, #ffffff)",
          color: "var(--course-ink, inherit)",
          borderRadius: "var(--course-radius, 8px)",
          fontFamily: "var(--course-font-body, inherit)",
        }}
      >
        {/* Tiêu đề */}
        <div
          className="mb-6 flex flex-col items-center gap-2"
          style={{ color: "var(--course-accent, var(--primary))" }}
        >
          <Award className="h-12 w-12" aria-hidden="true" />
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--course-font-heading, inherit)" }}
          >
            Chứng nhận hoàn thành
          </h2>
        </div>

        {/* Người học */}
        <p className="mb-1 text-sm text-muted-foreground">Chứng nhận cấp cho</p>
        <p className="mb-6 text-xl font-semibold">{learnerName}</p>

        {/* Khoá học */}
        <p className="mb-1 text-sm text-muted-foreground">đã hoàn thành khoá học</p>
        <p
          className="mb-6 text-lg font-bold"
          style={{ color: "var(--course-accent, var(--primary))" }}
        >
          {courseTitle}
        </p>

        {/* Ngày */}
        <div
          className="mx-auto mt-6 w-fit rounded-full px-4 py-1.5 text-sm font-medium"
          style={{
            backgroundColor: "var(--course-accent, var(--primary))",
            color: "var(--course-accent-fg, #ffffff)",
          }}
        >
          {completionDate}
        </div>
      </div>
    </div>
  );
}
