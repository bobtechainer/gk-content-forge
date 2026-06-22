import type { Capability, OrgRoleId } from "./capabilities";

export interface Login {
  id: string;
  email: string;
  name: string;
  shortName: string;
  avatarColor: string;
  systemRole?: "admin" | "reviewer";
}
export type OrgNodeType = "business" | "personal";
export interface OrgNode {
  id: string;
  name: string;
  shortName: string;
  type: OrgNodeType;
  parentId: string | null;
  avatarColor: string;
  businessLicense?: string;
  bio?: string;
  followers?: number;
  website?: string;
  email?: string;
}
export interface Membership {
  id: string;
  loginId: string;
  nodeId: string;
  role: OrgRoleId;
  extraCapabilities?: Capability[];
  lockedByPin: boolean;
  pin?: string;
}
