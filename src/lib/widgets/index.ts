import { TIMELINE_SORT_WIDGET } from "./timeline-sort";
import { H2O2_GRAPH_WIDGET } from "./h2o2-graph";
import { COLLISION_BOX_WIDGET } from "./collision-box";
import { SURFACE_TEMP_WIDGET } from "./surface-temperature";
import { ENERGY_MOUNTAIN_WIDGET } from "./energy-mountain";

export {
  TIMELINE_SORT_WIDGET,
  H2O2_GRAPH_WIDGET,
  COLLISION_BOX_WIDGET,
  SURFACE_TEMP_WIDGET,
  ENERGY_MOUNTAIN_WIDGET,
};

/** Ready-made interactive widgets a teacher can drop into an "html" block. */
export interface WidgetTemplate {
  id: string;
  label: string;
  html: string;
}

export const WIDGET_TEMPLATES: WidgetTemplate[] = [
  { id: "timeline", label: "Trục thời gian (kéo-thả)", html: TIMELINE_SORT_WIDGET },
  { id: "h2o2", label: "Đồ thị H₂O₂ (ΔC/Δt)", html: H2O2_GRAPH_WIDGET },
  { id: "collision", label: "Hộp va chạm phân tử", html: COLLISION_BOX_WIDGET },
  { id: "surface-temp", label: "Diện tích bề mặt & Van't Hoff", html: SURFACE_TEMP_WIDGET },
  { id: "energy", label: "Núi năng lượng & xúc tác", html: ENERGY_MOUNTAIN_WIDGET },
];
