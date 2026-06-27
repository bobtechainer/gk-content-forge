export type Viewport = "desktop" | "tablet" | "mobile";

const MAX_WIDTH: Record<Viewport, string> = {
  desktop: "max-w-none",
  tablet: "max-w-[768px]",
  mobile: "max-w-[390px]",
};

export function viewportMaxWidth(vp: Viewport): string {
  return MAX_WIDTH[vp];
}
