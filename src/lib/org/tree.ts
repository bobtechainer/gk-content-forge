import type { OrgNode } from "./types";

export const nodeById = (nodes: OrgNode[], id: string): OrgNode | null =>
  nodes.find((n) => n.id === id) ?? null;

export const childrenOf = (nodes: OrgNode[], parentId: string): OrgNode[] =>
  nodes.filter((n) => n.parentId === parentId);

/** [node, parent, ..., root] */
export const ancestorChain = (nodes: OrgNode[], id: string): string[] => {
  const out: string[] = [];
  let cur = nodeById(nodes, id);
  while (cur) {
    out.push(cur.id);
    cur = cur.parentId ? nodeById(nodes, cur.parentId) : null;
  }
  return out;
};

/** node + mọi con cháu */
export const subtreeIds = (nodes: OrgNode[], id: string): string[] => {
  const out = [id];
  for (const child of childrenOf(nodes, id)) out.push(...subtreeIds(nodes, child.id));
  return out;
};
