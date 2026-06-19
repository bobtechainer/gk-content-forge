// src/lib/registry-id.ts
import type { ContentTier } from "./types";

export const TIER_CODE: Record<ContentTier, string> = {
  root: "GOC",
  partner: "DT",
  community: "CD",
};

const TIER_BY_CODE: Record<string, ContentTier> = {
  GOC: "root",
  DT: "partner",
  CD: "community",
};

const SUBJECT_CODE: Record<string, string> = {
  Toán: "TOAN",
  "Ngữ văn": "VAN",
  "Tiếng Anh": "ANH",
  "Vật lí": "LY",
  "Vật lý": "LY",
  "Hóa học": "HOA",
  "Sinh học": "SINH",
  "Lịch sử": "SU",
  "Địa lí": "DIA",
  "Địa lý": "DIA",
  "Tin học": "TIN",
  "Giáo dục công dân": "GDCD",
  "Công nghệ": "CN",
};

export const subjectCode = (subject: string): string => SUBJECT_CODE[subject] ?? "KHAC";

export const generateRegistryId = (
  tier: ContentTier,
  subject: string,
  seq: number,
  year: number,
): string =>
  `THS-${TIER_CODE[tier]}-${year}-${subjectCode(subject)}-${String(seq).padStart(6, "0")}`;

export interface ParsedRegistryId {
  tier: ContentTier;
  year: number;
  subjectCode: string;
  seq: number;
}

const RE = /^THS-(GOC|DT|CD)-(\d{4})-([A-Z]+)-(\d{6})$/;

export const parseRegistryId = (id: string): ParsedRegistryId | null => {
  const m = RE.exec(id);
  if (!m) return null;
  return {
    tier: TIER_BY_CODE[m[1]],
    year: Number(m[2]),
    subjectCode: m[3],
    seq: Number(m[4]),
  };
};
