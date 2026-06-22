import { ROLE_CAPABILITIES, type Capability } from "./capabilities";
import { ancestorChain, nodeById } from "./tree";
import type { Membership, OrgNode } from "./types";

interface OrgData { nodes: OrgNode[]; memberships: Membership[]; }

export const effectiveCapabilities = (
  loginId: string, nodeId: string, { nodes, memberships }: OrgData,
): Set<Capability> => {
  const chain = new Set(ancestorChain(nodes, nodeId));
  const caps = new Set<Capability>();
  for (const m of memberships) {
    if (m.loginId !== loginId || !chain.has(m.nodeId)) continue;
    for (const c of ROLE_CAPABILITIES[m.role]) caps.add(c);
    for (const c of m.extraCapabilities ?? []) caps.add(c);
  }
  return caps;
};

export const can = (caps: Set<Capability>, c: Capability): boolean => caps.has(c);

export interface ProfileRef { membership: Membership; node: OrgNode | null; }

export const profilesForLogin = (
  loginId: string, { nodes, memberships }: OrgData,
): ProfileRef[] =>
  memberships
    .filter((m) => m.loginId === loginId)
    .map((m) => ({ membership: m, node: nodeById(nodes, m.nodeId) }));
