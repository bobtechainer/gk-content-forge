/** Phase 0 stub: chưa có theme per-course → kế thừa token global (map rỗng).
 *  Phase 3 sẽ trả map { "--course-accent": "...", ... } từ authored-intent. */
export type CourseThemeVars = Record<string, string>;

// Placeholder type; Phase 3 thay bằng interface đầy đủ trong spec.
export interface CourseTheme {
  base: string;
}

export function getResolvedThemeVars(_theme?: CourseTheme): CourseThemeVars {
  return {};
}
