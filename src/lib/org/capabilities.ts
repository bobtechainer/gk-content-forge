export type Capability =
  | "content.view" | "content.create" | "content.edit_any" | "content.submit"
  | "content.publish_sign" | "analytics.view"
  | "members.manage" | "suborg.manage" | "org.settings" | "org.transfer";

export const ALL_CAPABILITIES: Capability[] = [
  "content.view", "content.create", "content.edit_any", "content.submit",
  "content.publish_sign", "analytics.view",
  "members.manage", "suborg.manage", "org.settings", "org.transfer",
];

export type OrgRoleId = "owner" | "admin" | "manager" | "editor" | "publisher" | "viewer";

export const ORG_ROLE_LABELS: Record<OrgRoleId, string> = {
  owner: "Chủ sở hữu", admin: "Quản trị", manager: "Quản lý",
  editor: "Biên tập/CTV", publisher: "Phát hành/Ký số", viewer: "Người xem",
};

export const ROLE_CAPABILITIES: Record<OrgRoleId, Capability[]> = {
  owner: [...ALL_CAPABILITIES],
  admin: ["content.view","content.create","content.edit_any","content.submit","content.publish_sign","analytics.view","members.manage","suborg.manage","org.settings"],
  manager: ["content.view","content.create","content.edit_any","content.submit","analytics.view"],
  editor: ["content.view","content.create","content.submit"],
  publisher: ["content.view","content.submit","content.publish_sign"],
  viewer: ["content.view"],
};
