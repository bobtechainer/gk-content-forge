import type { AccountType, ContentItem, RoleId } from "@/lib/types";
import { getDefaultAppPath } from "@/lib/taxonomy";

export const getVisibleContentItems = (
  items: ContentItem[],
  roleId: RoleId | null,
): ContentItem[] => {
  if (roleId === "admin") return items;
  if (!roleId) return [];
  return items.filter((item) => item.ownerId === roleId);
};

export const getVisibleMaterialItems = (
  items: ContentItem[],
  roleId: RoleId | null,
): ContentItem[] =>
  getVisibleContentItems(items, roleId).filter((item) => item.category === "learning_material");

export const getAppHomeForAccount = (accountType: AccountType) => getDefaultAppPath(accountType);
