import {
  CONTENT_TAXONOMY,
  CREATION_CATEGORIES,
  LEARNING_MATERIAL_SUBTYPES as TAXONOMY_LEARNING_MATERIAL_SUBTYPES,
  LEARNING_MATERIAL_TYPES,
  getMaterialZone,
  type TaxonomyNode,
} from "./taxonomy";
import type { CreationCategory, LearningMaterialSubtype } from "./types";

export { CONTENT_TAXONOMY, getMaterialZone };
export type { CreationCategory, LearningMaterialSubtype } from "./types";

const CATEGORY_LABELS: Record<CreationCategory, string> = {
  book: "Book",
  course: "Course",
  learning_material: "Learning Materials",
};

export const LEARNING_MATERIAL_SUBTYPES = LEARNING_MATERIAL_TYPES;

export const TOP_LEVEL_CREATION_CATEGORIES: TaxonomyNode<CreationCategory>[] =
  CREATION_CATEGORIES.map((item) => ({ ...item, label: CATEGORY_LABELS[item.id] }));

export const LEARNING_MATERIAL_OPTIONS: TaxonomyNode<LearningMaterialSubtype>[] =
  TAXONOMY_LEARNING_MATERIAL_SUBTYPES.map((item) => ({ ...item, label: item.id }));

export const getCreationLabel = (id: CreationCategory | LearningMaterialSubtype) => {
  if (id === "book" || id === "course" || id === "learning_material") return CATEGORY_LABELS[id];
  return id;
};
