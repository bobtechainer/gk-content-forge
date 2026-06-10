import { useNavigate } from "@tanstack/react-router";
import type { CreationCategory, LearningMaterialSubtype } from "./types";
import type { StudioScope } from "./use-scoped-content";
import { useContent } from "@/stores/content";
import { useSession } from "@/stores/session";

/** Creates a draft and routes to the matching builder for the given shell scope. */
export function useCreateContent(scope: StudioScope) {
  const navigate = useNavigate();
  const createDraft = useContent((s) => s.createDraft);
  const roleId = useSession((s) => s.roleId);
  const base = scope === "org" ? "/org" : "/creator";

  const createCategory = (category: CreationCategory) => {
    if (!roleId || category === "learning_material") return;
    const id = createDraft(category, roleId, { category });
    navigate({
      to: category === "book" ? `${base}/builder/book/$id` : `${base}/builder/course/$id`,
      params: { id },
    });
  };

  const createMaterial = (materialSubtype: LearningMaterialSubtype) => {
    if (!roleId) return;
    const id = createDraft("learning_material", roleId, {
      category: "learning_material",
      materialSubtype,
    });
    navigate({
      to: materialSubtype === "quiz" ? `${base}/builder/quiz/$id` : `${base}/builder/material/$id`,
      params: { id },
    });
  };

  return { createCategory, createMaterial };
}
