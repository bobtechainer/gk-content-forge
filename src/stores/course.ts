import { create } from "zustand";
import { persist } from "zustand/middleware";

/* ─── Block Types ──────────────────────────────────────────────── */

export type CourseBlockType =
  | "text"
  | "image"
  | "video"
  | "callout"
  | "divider"
  | "embed"
  | "code"
  | "math"
  | "columns"
  | "quiz";

export type CalloutVariant = "info" | "tip" | "warning" | "danger";
export type BlockLayout = "centered" | "full";
export type BlockAnimation = "none" | "fade-up" | "parallax" | "progressive";

export interface CourseBlock {
  id: string;
  type: CourseBlockType;
  content: string;
  /** Callout variant */
  calloutVariant?: CalloutVariant;
  /** Embed: linked material id */
  embedMaterialId?: string;
  /** Embed: material title (denormalized) */
  embedTitle?: string;
  /** Embed: material type label */
  embedType?: string;
  /** Embed: raw HTML rendered live in a sandboxed iframe (advanced material,
   *  e.g. an interactive 3D periodic table). Takes precedence over the card. */
  embedHtml?: string;
  /** Embed: iframe height in px for HTML embeds (default 480). */
  embedHeight?: number;
  /** Code: language */
  codeLanguage?: string;
  /** Image/Video: alt text or caption */
  caption?: string;
  /** Layout mode: centered (default) or full-width */
  layout?: BlockLayout;
  /** Scroll animation style */
  animation?: BlockAnimation;
  /** Columns block: number of columns (2+) */
  columnCount?: number;
  /** Columns block: child blocks per column */
  columnChildren?: CourseBlock[][];

  /* ─── Interactive blocks ─────────────────────────────── */
  /** Quiz: answer options (content holds the question) */
  quizOptions?: string[];
  /** Quiz: index of the correct option */
  quizCorrect?: number;
  /** Quiz: explanation shown after answering */
  quizExplanation?: string;
}

/* ─── Lesson / Chapter / Course ────────────────────────────────── */

export interface CourseLesson {
  id: string;
  title: string;
  chapterId: string;
  blocks: CourseBlock[];
}

export interface CourseChapter {
  id: string;
  title: string;
  courseId: string;
}

export interface CourseData {
  chapters: CourseChapter[];
  lessons: CourseLesson[];
}

/* ─── Store ─────────────────────────────────────────────────────── */

interface CourseState {
  courseData: Record<string, CourseData>;
  activeLessonId: string | null;

  init: (courseId: string) => void;

  // Chapter CRUD
  addChapter: (courseId: string, title?: string) => string;
  renameChapter: (courseId: string, chapterId: string, title: string) => void;
  deleteChapter: (courseId: string, chapterId: string) => void;
  reorderChapters: (courseId: string, fromId: string, toId: string) => void;

  // Lesson CRUD
  addLesson: (courseId: string, chapterId: string, title?: string) => string;
  renameLesson: (courseId: string, lessonId: string, title: string) => void;
  deleteLesson: (courseId: string, lessonId: string) => void;
  reorderLessons: (courseId: string, fromId: string, toId: string) => void;
  setActiveLesson: (lessonId: string | null) => void;

  // Block CRUD
  addBlock: (courseId: string, lessonId: string, type: CourseBlockType, atIndex?: number) => string;
  updateBlock: (courseId: string, lessonId: string, blockId: string, patch: Partial<CourseBlock>) => void;
  deleteBlock: (courseId: string, lessonId: string, blockId: string) => void;
  duplicateBlock: (courseId: string, lessonId: string, blockId: string) => string;
  reorderBlocks: (courseId: string, lessonId: string, fromId: string, toId: string) => void;
  moveBlockToIndex: (courseId: string, lessonId: string, blockId: string, newIndex: number) => void;
}

function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function defaultBlock(type: CourseBlockType): CourseBlock {
  const id = makeId("blk");
  const base: CourseBlock = { id, type, content: "", layout: "centered", animation: "fade-up" };
  switch (type) {
    case "text":
      return { ...base, content: "" };
    case "image":
      return { ...base, content: "", caption: "" };
    case "video":
      return { ...base, content: "", caption: "" };
    case "callout":
      return { ...base, content: "", calloutVariant: "info" };
    case "divider":
      return { ...base };
    case "embed":
      return { ...base, embedMaterialId: "", embedTitle: "", embedType: "" };
    case "code":
      return { ...base, content: "", codeLanguage: "javascript" };
    case "math":
      return { ...base, content: "" };
    case "columns":
      return { ...base, columnCount: 2, columnChildren: [[], []] };
    case "quiz":
      return {
        ...base,
        content: "Câu hỏi của bạn?",
        quizOptions: ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C"],
        quizCorrect: 0,
        quizExplanation: "",
      };
    default:
      return base;
  }
}

function reorderArray<T extends { id: string }>(arr: T[], fromId: string, toId: string): T[] {
  const from = arr.findIndex((x) => x.id === fromId);
  const to = arr.findIndex((x) => x.id === toId);
  if (from < 0 || to < 0 || from === to) return arr;
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** Deep-clone a block, regenerating its id and copying nested arrays so a
 *  duplicate never shares mutable state (column children, quiz options, slider
 *  stops) with the original. */
function cloneBlockDeep(block: CourseBlock): CourseBlock {
  return {
    ...block,
    id: makeId("blk"),
    columnChildren: block.columnChildren?.map((col) => col.map((child) => cloneBlockDeep(child))),
    quizOptions: block.quizOptions ? [...block.quizOptions] : undefined,
  };
}

/* ─── Lesson sections (gated preview) ──────────────────────────────
 * A `divider` block marks a SECTION BREAK. In preview mode the lesson is
 * revealed one section at a time; the learner must answer the current
 * section's quizzes correctly before the next section unlocks — so the
 * preview mirrors the real learning experience. These pure helpers are
 * unit-tested in course.test.ts.
 * ────────────────────────────────────────────────────────────────── */

/** Split a block list into sections, using `divider` blocks as separators.
 *  Dividers are consumed (not rendered); empty runs are dropped. Always
 *  returns at least one section. */
export function splitIntoSections(blocks: CourseBlock[]): CourseBlock[][] {
  const sections: CourseBlock[][] = [];
  let current: CourseBlock[] = [];
  for (const b of blocks) {
    if (b.type === "divider") {
      if (current.length) { sections.push(current); current = []; }
    } else {
      current.push(b);
    }
  }
  if (current.length) sections.push(current);
  return sections.length ? sections : [[]];
}

/** Collect the ids of every quiz block in a section, recursing into columns. */
export function collectQuizIds(blocks: CourseBlock[]): string[] {
  const ids: string[] = [];
  const walk = (list: CourseBlock[]) => {
    for (const b of list) {
      if (b.type === "quiz") ids.push(b.id);
      if (b.columnChildren) b.columnChildren.forEach(walk);
    }
  };
  walk(blocks);
  return ids;
}

/* ─── Sample lesson data (Hóa học 10 — Bảng tuần hoàn) ─────────────
 * Real element data so the demo is vivid out-of-the-box. All ids below are
 * placeholders — cloneSampleCourse() regenerates fresh unique ids per course.
 * ────────────────────────────────────────────────────────────────── */

const PERIODIC_20: { z: number; sym: string; name: string; period: number; group: string; config: string }[] = [
  { z: 1, sym: "H", name: "Hydro", period: 1, group: "IA", config: "1s¹" },
  { z: 2, sym: "He", name: "Heli", period: 1, group: "VIIIA", config: "1s²" },
  { z: 3, sym: "Li", name: "Liti", period: 2, group: "IA", config: "1s²2s¹" },
  { z: 4, sym: "Be", name: "Beri", period: 2, group: "IIA", config: "1s²2s²" },
  { z: 5, sym: "B", name: "Bo", period: 2, group: "IIIA", config: "1s²2s²2p¹" },
  { z: 6, sym: "C", name: "Carbon", period: 2, group: "IVA", config: "1s²2s²2p²" },
  { z: 7, sym: "N", name: "Nitơ", period: 2, group: "VA", config: "1s²2s²2p³" },
  { z: 8, sym: "O", name: "Oxi", period: 2, group: "VIA", config: "1s²2s²2p⁴" },
  { z: 9, sym: "F", name: "Flo", period: 2, group: "VIIA", config: "1s²2s²2p⁵" },
  { z: 10, sym: "Ne", name: "Neon", period: 2, group: "VIIIA", config: "1s²2s²2p⁶" },
  { z: 11, sym: "Na", name: "Natri", period: 3, group: "IA", config: "1s²2s²2p⁶3s¹" },
  { z: 12, sym: "Mg", name: "Magie", period: 3, group: "IIA", config: "1s²2s²2p⁶3s²" },
  { z: 13, sym: "Al", name: "Nhôm", period: 3, group: "IIIA", config: "1s²2s²2p⁶3s²3p¹" },
  { z: 14, sym: "Si", name: "Silic", period: 3, group: "IVA", config: "1s²2s²2p⁶3s²3p²" },
  { z: 15, sym: "P", name: "Photpho", period: 3, group: "VA", config: "1s²2s²2p⁶3s²3p³" },
  { z: 16, sym: "S", name: "Lưu huỳnh", period: 3, group: "VIA", config: "1s²2s²2p⁶3s²3p⁴" },
  { z: 17, sym: "Cl", name: "Clo", period: 3, group: "VIIA", config: "1s²2s²2p⁶3s²3p⁵" },
  { z: 18, sym: "Ar", name: "Argon", period: 3, group: "VIIIA", config: "1s²2s²2p⁶3s²3p⁶" },
  { z: 19, sym: "K", name: "Kali", period: 4, group: "IA", config: "1s²2s²2p⁶3s²3p⁶4s¹" },
  { z: 20, sym: "Ca", name: "Canxi", period: 4, group: "IIA", config: "1s²2s²2p⁶3s²3p⁶4s²" },
];

/* ─── Interactive periodic table (advanced HTML material) ──────────
 * A fully self-contained HTML document (CSS + vanilla JS, zero external
 * deps) rendered live inside a sandboxed iframe by the Embed block. This
 * is the kind of "advanced material" a teacher can paste in to make the
 * lesson feel alive — hover to lift a tile in 3D, click to inspect the
 * electron configuration.
 * ────────────────────────────────────────────────────────────────── */

const CAT_COLOR: Record<string, string> = {
  "Kim loại kiềm": "#f59e0b",
  "Kim loại kiềm thổ": "#f97316",
  "Á kim": "#14b8a6",
  "Phi kim": "#10b981",
  Halogen: "#06b6d4",
  "Khí hiếm": "#a855f7",
  "Kim loại": "#64748b",
};

const COL_CAT: Record<number, { col: number; cat: string }> = {
  1: { col: 1, cat: "Phi kim" }, 2: { col: 18, cat: "Khí hiếm" },
  3: { col: 1, cat: "Kim loại kiềm" }, 4: { col: 2, cat: "Kim loại kiềm thổ" },
  5: { col: 13, cat: "Á kim" }, 6: { col: 14, cat: "Phi kim" }, 7: { col: 15, cat: "Phi kim" },
  8: { col: 16, cat: "Phi kim" }, 9: { col: 17, cat: "Halogen" }, 10: { col: 18, cat: "Khí hiếm" },
  11: { col: 1, cat: "Kim loại kiềm" }, 12: { col: 2, cat: "Kim loại kiềm thổ" },
  13: { col: 13, cat: "Kim loại" }, 14: { col: 14, cat: "Á kim" }, 15: { col: 15, cat: "Phi kim" },
  16: { col: 16, cat: "Phi kim" }, 17: { col: 17, cat: "Halogen" }, 18: { col: 18, cat: "Khí hiếm" },
  19: { col: 1, cat: "Kim loại kiềm" }, 20: { col: 2, cat: "Kim loại kiềm thổ" },
};

const TABLE_ELEMENTS = PERIODIC_20.map((e) => ({
  z: e.z, sym: e.sym, name: e.name, period: e.period, group: e.group, config: e.config,
  col: COL_CAT[e.z].col, cat: COL_CAT[e.z].cat, color: CAT_COLOR[COL_CAT[e.z].cat],
}));

export const PERIODIC_TABLE_HTML =
  `<!doctype html><html lang="vi"><head><meta charset="utf-8">` +
  `<meta name="viewport" content="width=device-width,initial-scale=1"><style>` +
  `*{box-sizing:border-box;margin:0;padding:0}` +
  `body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:radial-gradient(120% 120% at 50% 0,#1e293b 0,#0f172a 60%);color:#e2e8f0;padding:18px 18px 22px;overflow-x:auto}` +
  `h1{font-size:15px;font-weight:800}.sub{font-size:11px;color:#94a3b8;margin:2px 0 12px}` +
  `.legend{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px;font-size:10px;color:#cbd5e1}` +
  `.legend span{display:flex;align-items:center;gap:5px}.dot{width:11px;height:11px;border-radius:3px}` +
  `.table{display:grid;grid-template-columns:repeat(18,minmax(30px,1fr));gap:5px;min-width:580px;perspective:1000px}` +
  `.cell{position:relative;aspect-ratio:1;border:none;border-radius:7px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;color:#fff;font-family:inherit;transition:transform .18s ease,box-shadow .18s ease;transform-style:preserve-3d}` +
  `.cell:hover{transform:translateY(-5px) scale(1.1) rotateX(14deg);box-shadow:0 10px 22px rgba(0,0,0,.5);z-index:5}` +
  `.cell.sel{outline:2px solid #fff;outline-offset:1px;transform:translateY(-3px) scale(1.06)}` +
  `.z{position:absolute;top:3px;left:5px;font-size:8px;opacity:.85}.sym{font-size:16px;font-weight:800;line-height:1}` +
  `.nm{font-size:7px;opacity:.9;margin-top:2px;text-align:center;padding:0 1px}` +
  `.detail{margin-top:16px;min-height:70px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:14px 16px;display:flex;gap:16px;align-items:center;transition:.2s}` +
  `.detail .big{font-size:34px;font-weight:800;line-height:1;min-width:54px;text-align:center}` +
  `.detail .meta{font-size:12px;line-height:1.6;color:#cbd5e1}.detail .meta b{color:#fff}` +
  `.hint{font-size:10px;color:#64748b;margin-top:10px}` +
  `</style></head><body>` +
  `<h1>Bảng tuần hoàn tương tác — 20 nguyên tố đầu tiên</h1>` +
  `<div class="sub">Di chuột để phóng nổi 3D · Bấm vào ô để xem cấu hình electron</div>` +
  `<div class="legend" id="lg"></div><div class="table" id="t"></div>` +
  `<div class="detail" id="d"><div class="meta">👆 Bấm vào một nguyên tố để khám phá cấu hình electron, chu kì và nhóm của nó.</div></div>` +
  `<div class="hint">Mẹo: các nguyên tố cùng một cột (nhóm) có tính chất hóa học rất giống nhau.</div>` +
  `<script>` +
  `var E=${JSON.stringify(TABLE_ELEMENTS)};var CC=${JSON.stringify(CAT_COLOR)};` +
  `var t=document.getElementById('t'),d=document.getElementById('d'),lg=document.getElementById('lg');` +
  `Object.keys(CC).forEach(function(k){var s=document.createElement('span');s.innerHTML='<i class="dot" style="background:'+CC[k]+'"></i>'+k;lg.appendChild(s);});` +
  `function show(el){d.innerHTML='<div class="big" style="color:'+el.color+'">'+el.sym+'</div><div class="meta"><b>'+el.name+'</b> · Số hiệu Z = '+el.z+'<br>Chu kì '+el.period+' · Nhóm '+el.group+' · '+el.cat+'<br>Cấu hình electron: <b>'+el.config+'</b></div>';}` +
  `E.forEach(function(el){var c=document.createElement('button');c.className='cell';c.style.gridColumn=el.col;c.style.gridRow=el.period;c.style.background='linear-gradient(145deg,'+el.color+',rgba(0,0,0,.18))';` +
  `c.innerHTML='<span class="z">'+el.z+'</span><span class="sym">'+el.sym+'</span><span class="nm">'+el.name+'</span>';` +
  `c.addEventListener('mouseenter',function(){show(el);});` +
  `c.addEventListener('click',function(){var a=document.querySelectorAll('.cell');for(var i=0;i<a.length;i++)a[i].classList.remove('sel');c.classList.add('sel');show(el);});` +
  `t.appendChild(c);});` +
  `</script></body></html>`;

const BANNER_TILES = [
  { z: 1, sym: "H", name: "Hydro", color: "#ef4444" },
  { z: 2, sym: "He", name: "Heli", color: "#a855f7" },
  { z: 3, sym: "Li", name: "Liti", color: "#f59e0b" },
  { z: 6, sym: "C", name: "Carbon", color: "#10b981" },
  { z: 8, sym: "O", name: "Oxi", color: "#3b82f6" },
  { z: 11, sym: "Na", name: "Natri", color: "#f59e0b" },
  { z: 17, sym: "Cl", name: "Clo", color: "#06b6d4" },
];

const BANNER_SVG =
  `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='196' viewBox='0 0 640 196'>` +
  `<rect width='640' height='196' rx='16' fill='#0f172a'/>` +
  `<text x='28' y='48' fill='#e2e8f0' font-family='Arial, sans-serif' font-size='26' font-weight='700'>Bảng tuần hoàn các nguyên tố</text>` +
  `<text x='28' y='74' fill='#94a3b8' font-family='Arial, sans-serif' font-size='13'>20 nguyên tố đầu tiên · Hóa học 10</text>` +
  BANNER_TILES.map((t, i) => {
    const x = 28 + i * 84;
    return (
      `<g transform='translate(${x},96)'>` +
      `<rect width='72' height='72' rx='10' fill='${t.color}'/>` +
      `<text x='9' y='20' fill='#ffffff' font-family='Arial, sans-serif' font-size='11'>${t.z}</text>` +
      `<text x='36' y='45' fill='#ffffff' font-family='Arial, sans-serif' font-size='24' font-weight='700' text-anchor='middle'>${t.sym}</text>` +
      `<text x='36' y='62' fill='#ffffff' font-family='Arial, sans-serif' font-size='9' text-anchor='middle'>${t.name}</text>` +
      `</g>`
    );
  }).join("") +
  `</svg>`;

const PERIODIC_BANNER = `data:image/svg+xml,${encodeURIComponent(BANNER_SVG)}`;

const SAMPLE_COURSE: CourseData = {
  chapters: [
    { id: "ch_s_1", title: "Chương 1: Khám phá Bảng tuần hoàn", courseId: "demo" },
    { id: "ch_s_2", title: "Chương 2: Liên kết hóa học", courseId: "demo" },
  ],
  lessons: [
    {
      id: "ls_s_1",
      title: "Bài 1: Bảng tuần hoàn — Bản đồ của Hóa học",
      chapterId: "ch_s_1",
      blocks: [
        /* ── Phần 1: Mở đầu ── */
        { id: "b_1_1", type: "text", animation: "fade-up", content: "<h2>Bảng tuần hoàn: tấm bản đồ của vũ trụ hóa học</h2><p>Chỉ với <strong>một bảng duy nhất</strong>, các nhà khoa học đã sắp xếp mọi nguyên tố theo một trật tự tiết lộ <em>tính chất</em> của chúng. Vị trí của một nguyên tố cho ta biết nó <strong>phản ứng thế nào</strong>, <strong>nặng bao nhiêu</strong> và <strong>electron sắp xếp ra sao</strong>.</p>" },
        { id: "b_1_2", type: "callout", calloutVariant: "tip", content: "Ý tưởng lớn: vị trí = tính chất. Các nguyên tố cùng một cột (nhóm) có tính chất hóa học rất giống nhau." },
        { id: "b_1_3", type: "image", layout: "full", animation: "parallax", content: PERIODIC_BANNER, caption: "20 nguyên tố đầu tiên — tô màu theo loại nguyên tố" },
        { id: "b_1_d1", type: "divider", content: "" },

        /* ── Phần 2: Chu kì & Nhóm (cổng: 2 câu hỏi) ── */
        { id: "b_1_4", type: "text", animation: "fade-up", content: "<h2>Chu kì và Nhóm</h2><p>Bảng gồm các <strong>hàng ngang</strong> gọi là <strong>chu kì</strong> và các <strong>cột dọc</strong> gọi là <strong>nhóm</strong>. Hai khái niệm này nắm giữ chìa khóa:</p>" },
        {
          id: "b_1_5", type: "columns", layout: "full", content: "", columnCount: 2,
          columnChildren: [
            [{ id: "b_1_5a", type: "text", layout: "centered", animation: "fade-up", content: "Chu kì (hàng ngang): Số thứ tự chu kì = số lớp electron. Ví dụ Natri ở chu kì 3 nên nguyên tử của nó có 3 lớp electron." }],
            [{ id: "b_1_5b", type: "text", layout: "centered", animation: "fade-up", content: "Nhóm (cột dọc): Số nhóm A = số electron ở lớp ngoài cùng. Ví dụ nhóm IA đều có 1 electron ngoài cùng nên rất dễ phản ứng." }],
          ],
        },
        { id: "b_1_6", type: "text", content: "<p>Mỗi lớp electron chứa được tối đa bao nhiêu electron? Có một công thức gọn gàng:</p>" },
        { id: "b_1_7", type: "math", animation: "fade-up", content: "e_{\\text{max}} = 2n^{2}" },
        { id: "b_1_8", type: "callout", calloutVariant: "info", content: "Vì sao khí hiếm (He, Ne, Ar) lại trơ về mặt hóa học? Vì lớp electron ngoài cùng của chúng đã bão hòa (2 hoặc 8 electron) — cấu hình cực kỳ bền vững (quy tắc bát tử), nên hầu như không cần cho hay nhận electron." },
        { id: "b_1_11", type: "text", animation: "progressive", content: "<p>Trả lời 2 câu hỏi dưới đây để mở khóa phần khám phá tương tác 👇</p>" },
        { id: "b_1_12", type: "quiz", content: "Nguyên tố nào có cấu hình electron 1s²2s²2p⁶3s¹?", quizOptions: ["Natri (Na)", "Magie (Mg)", "Kali (K)", "Liti (Li)"], quizCorrect: 0, quizExplanation: "Tổng số electron = 2+2+6+1 = 11 ⇒ Z = 11 ⇒ Natri (Na). Nó có 1 electron lớp ngoài cùng (3s¹) nên thuộc nhóm IA." },
        { id: "b_1_13", type: "quiz", content: "Số hiệu nguyên tử (Z) cho ta biết điều gì?", quizOptions: ["Số proton trong hạt nhân", "Số nơtron trong hạt nhân", "Khối lượng của nguyên tử", "Số phân tử trong chất"], quizCorrect: 0, quizExplanation: "Z = số proton, và với nguyên tử trung hòa thì cũng bằng số electron. Đây chính là 'chứng minh thư' nhận dạng mỗi nguyên tố." },
        { id: "b_1_d2", type: "divider", content: "" },

        /* ── Phần 3: Bảng tuần hoàn tương tác (học liệu nâng cao — nhúng HTML) ── */
        { id: "b_1_9", type: "text", animation: "fade-up", content: "<h2>Tự tay khám phá</h2><p>👉 Di chuột và bấm vào từng nguyên tố trong bảng <strong>tương tác</strong> bên dưới để xem cấu hình electron, chu kì và nhóm của nó.</p>" },
        { id: "b_1_10", type: "embed", layout: "full", animation: "parallax", content: "", embedTitle: "Bảng tuần hoàn tương tác — 20 nguyên tố", embedType: "interactive", embedHtml: PERIODIC_TABLE_HTML, embedHeight: 540 },
        { id: "b_1_18", type: "callout", calloutVariant: "tip", content: "Mẹo ghi nhớ thứ tự mức năng lượng: 1s 2s 2p 3s 3p 4s 3d 4p... (quy tắc Klechkowski)." },
        { id: "b_1_d3", type: "divider", content: "" },

        /* ── Phần 4: Củng cố ── */
        { id: "b_1_14", type: "callout", calloutVariant: "warning", content: "Nhầm lẫn thường gặp: số khối (A) khác số hiệu nguyên tử (Z). Công thức: A = Z + N (số proton + số nơtron)." },
        { id: "b_1_16", type: "text", content: "<p>Muốn dùng lập trình để in ra số electron tối đa của mỗi lớp? Đây là đoạn minh họa:</p>" },
        { id: "b_1_17", type: "code", codeLanguage: "python", content: "# Số electron tối đa của lớp thứ n là 2 * n^2\nfor n in range(1, 5):\n    print(f\"Lớp {n}: tối đa {2 * n ** 2} electron\")" },
        { id: "b_1_20", type: "quiz", content: "Kali (K) có Z = 19. Nó nằm ở chu kì nào?", quizOptions: ["Chu kì 4", "Chu kì 3", "Chu kì 2", "Chu kì 1"], quizCorrect: 0, quizExplanation: "Cấu hình ...3p⁶4s¹ ⇒ có 4 lớp electron ⇒ chu kì 4. (Lưu ý: 4s được điền trước 3d!)" },
        { id: "b_1_19", type: "video", content: "", caption: "Tải lên video bài giảng của bạn, hoặc dán link YouTube (ví dụ: bài hát Bảng tuần hoàn)." },
      ],
    },
    {
      id: "ls_s_2",
      title: "Bài 2: Cấu hình electron & vị trí nguyên tố",
      chapterId: "ch_s_1",
      blocks: [
        { id: "b_2_1", type: "text", content: "<h2>Từ cấu hình electron ⇒ đoán ra vị trí</h2><p>Nếu biết cách electron sắp xếp, bạn có thể suy ra <strong>chu kì</strong> và <strong>nhóm</strong> của nguyên tố mà không cần tra bảng.</p>" },
        { id: "b_2_2", type: "callout", calloutVariant: "tip", content: "Quy tắc nhanh: số lớp electron = số thứ tự chu kì; số electron lớp ngoài cùng = số thứ tự nhóm A." },
        { id: "b_2_3", type: "callout", calloutVariant: "info", content: "Quy tắc bát tử (octet): các nguyên tử có xu hướng đạt 8 electron ở lớp ngoài cùng (giống khí hiếm) để trở nên bền vững — bằng cách cho, nhận hoặc dùng chung electron." },
        { id: "b_2_4", type: "quiz", content: "Oxi có Z = 8. Cấu hình electron của nó là?", quizOptions: ["1s²2s²2p⁴", "1s²2s²2p⁶", "1s²2s²2p²", "1s²2s²2p⁶3s²"], quizCorrect: 0, quizExplanation: "8 electron: 1s²(2) + 2s²(2) + 2p⁴(4) = 8. Oxi ở chu kì 2, nhóm VIA, còn thiếu 2 electron để đạt bát tử nên rất dễ nhận thêm 2 electron." },
        { id: "b_2_d1", type: "divider", content: "" },
        { id: "b_2_5", type: "quiz", content: "Nguyên tố ở chu kì 3, nhóm IIA là nguyên tố nào?", quizOptions: ["Magie (Mg)", "Canxi (Ca)", "Beri (Be)", "Natri (Na)"], quizCorrect: 0, quizExplanation: "Chu kì 3 (3 lớp electron) + nhóm IIA (2 electron ngoài cùng) ⇒ cấu hình ...3s² ⇒ Z = 12 ⇒ Magie." },
        { id: "b_2_6", type: "callout", calloutVariant: "warning", content: "Đừng quên: 4s được điền trước 3d! Vì vậy Kali (Z=19) là ...3p⁶4s¹, không phải 3d¹." },
      ],
    },
    {
      id: "ls_s_3",
      title: "Bài 3: Liên kết ion — Vì sao muối ăn bền?",
      chapterId: "ch_s_2",
      blocks: [
        { id: "b_3_1", type: "text", content: "<h2>Natri + Clo ⇒ muối ăn (NaCl)</h2><p>Natri rất dễ <strong>cho đi</strong> 1 electron, gặp Clo lại rất 'thèm' <strong>nhận thêm</strong> 1 electron. Kết quả: cả hai cùng đạt cấu hình bền — rồi hút nhau bằng lực tĩnh điện.</p>" },
        { id: "b_3_2", type: "callout", calloutVariant: "info", content: "Sau khi cho/nhận electron: Na mất 1 electron ⇒ trở thành ion dương Na⁺; Cl nhận 1 electron ⇒ trở thành ion âm Cl⁻. Hai ion trái dấu hút nhau tạo thành liên kết ion." },
        { id: "b_3_3", type: "quiz", content: "Vì sao Natri rất dễ nhường đi 1 electron?", quizOptions: ["Vì chỉ có 1 electron lớp ngoài cùng, nhường đi sẽ đạt cấu hình bền của Neon", "Vì nó là một kim loại nặng", "Vì nó đã có 8 electron lớp ngoài cùng", "Vì nó là một khí hiếm"], quizCorrect: 0, quizExplanation: "Na có cấu hình ...3s¹. Bỏ đi 1 electron thì còn ...2p⁶, giống hệt khí hiếm Neon (rất bền). Đó chính là động lực hóa học." },
        { id: "b_3_4", type: "callout", calloutVariant: "tip", content: "Quy luật chung: kim loại (bên trái bảng) có xu hướng cho electron, còn phi kim (bên phải bảng) có xu hướng nhận electron." },
      ],
    },
  ],
};

/** Build a fresh copy of the sample course for a given courseId, with unique
 *  chapter/lesson/block ids so different courses never alias the same objects. */
function cloneSampleCourse(courseId: string): CourseData {
  const chapterIdMap: Record<string, string> = {};
  const chapters: CourseChapter[] = SAMPLE_COURSE.chapters.map((ch) => {
    const id = makeId("ch");
    chapterIdMap[ch.id] = id;
    return { ...ch, id, courseId };
  });
  const lessons: CourseLesson[] = SAMPLE_COURSE.lessons.map((ls) => ({
    ...ls,
    id: makeId("ls"),
    chapterId: chapterIdMap[ls.chapterId] ?? ls.chapterId,
    blocks: ls.blocks.map((b) => cloneBlockDeep(b)),
  }));
  return { chapters, lessons };
}

export const useCourse = create<CourseState>()(
  persist(
    (set, get) => ({
      courseData: {},
      activeLessonId: null,

      init: (courseId) => {
        const existing = get().courseData[courseId];
        if (!existing) {
          // Initialize with a fresh, fully-cloned copy of the sample data
          const data = cloneSampleCourse(courseId);
          set({
            courseData: { ...get().courseData, [courseId]: data },
            activeLessonId: data.lessons[0]?.id ?? null,
          });
        } else {
          // activeLessonId is a single global value; make sure it points at a
          // lesson that actually belongs to THIS course (otherwise switching
          // courses would leave a stale id and a blank canvas).
          const cur = get().activeLessonId;
          const valid = cur != null && existing.lessons.some((l) => l.id === cur);
          if (!valid) {
            set({ activeLessonId: existing.lessons[0]?.id ?? null });
          }
        }
      },

      // ─── Chapter CRUD ──────────────────────────────
      addChapter: (courseId, title) => {
        const id = makeId("ch");
        const data = get().courseData[courseId];
        if (!data) return id;
        const chapter: CourseChapter = {
          id,
          title: title ?? `Chương ${data.chapters.length + 1}`,
          courseId,
        };
        set({
          courseData: {
            ...get().courseData,
            [courseId]: { ...data, chapters: [...data.chapters, chapter] },
          },
        });
        return id;
      },

      renameChapter: (courseId, chapterId, title) => {
        const data = get().courseData[courseId];
        if (!data) return;
        set({
          courseData: {
            ...get().courseData,
            [courseId]: {
              ...data,
              chapters: data.chapters.map((ch) =>
                ch.id === chapterId ? { ...ch, title } : ch,
              ),
            },
          },
        });
      },

      deleteChapter: (courseId, chapterId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const lessonIds = data.lessons.filter((l) => l.chapterId === chapterId).map((l) => l.id);
        const active = get().activeLessonId;
        set({
          courseData: {
            ...get().courseData,
            [courseId]: {
              ...data,
              chapters: data.chapters.filter((ch) => ch.id !== chapterId),
              lessons: data.lessons.filter((l) => l.chapterId !== chapterId),
            },
          },
          activeLessonId: active && lessonIds.includes(active) ? null : active,
        });
      },

      reorderChapters: (courseId, fromId, toId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        set({
          courseData: {
            ...get().courseData,
            [courseId]: { ...data, chapters: reorderArray(data.chapters, fromId, toId) },
          },
        });
      },

      // ─── Lesson CRUD ──────────────────────────────
      addLesson: (courseId, chapterId, title) => {
        const id = makeId("ls");
        const data = get().courseData[courseId];
        if (!data) return id;
        const existingInChapter = data.lessons.filter((l) => l.chapterId === chapterId);
        const lesson: CourseLesson = {
          id,
          title: title ?? `Bài ${existingInChapter.length + 1}`,
          chapterId,
          blocks: [],
        };
        // Insert lesson after last lesson of this chapter
        const lastIndex = data.lessons.map((l) => l.chapterId).lastIndexOf(chapterId);
        const insertAt = lastIndex >= 0 ? lastIndex + 1 : data.lessons.length;
        const nextLessons = [...data.lessons];
        nextLessons.splice(insertAt, 0, lesson);
        set({
          courseData: {
            ...get().courseData,
            [courseId]: { ...data, lessons: nextLessons },
          },
          activeLessonId: id,
        });
        return id;
      },

      renameLesson: (courseId, lessonId, title) => {
        const data = get().courseData[courseId];
        if (!data) return;
        set({
          courseData: {
            ...get().courseData,
            [courseId]: {
              ...data,
              lessons: data.lessons.map((l) =>
                l.id === lessonId ? { ...l, title } : l,
              ),
            },
          },
        });
      },

      deleteLesson: (courseId, lessonId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const active = get().activeLessonId;
        const remaining = data.lessons.filter((l) => l.id !== lessonId);
        set({
          courseData: {
            ...get().courseData,
            [courseId]: { ...data, lessons: remaining },
          },
          activeLessonId: active === lessonId ? (remaining[0]?.id ?? null) : active,
        });
      },

      reorderLessons: (courseId, fromId, toId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const fromL = data.lessons.find((l) => l.id === fromId);
        const toL = data.lessons.find((l) => l.id === toId);
        if (!fromL || !toL) return;
        // When dropping onto a lesson in another chapter, adopt that chapter so
        // the moved lesson re-renders under the destination group (not snapped
        // back to its original chapter).
        let lessons = data.lessons;
        if (fromL.chapterId !== toL.chapterId) {
          lessons = lessons.map((l) => (l.id === fromId ? { ...l, chapterId: toL.chapterId } : l));
        }
        lessons = reorderArray(lessons, fromId, toId);
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
      },

      setActiveLesson: (lessonId) => set({ activeLessonId: lessonId }),

      // ─── Block CRUD ──────────────────────────────
      addBlock: (courseId, lessonId, type, atIndex) => {
        const data = get().courseData[courseId];
        if (!data) return "";
        const block = defaultBlock(type);
        const lessons = data.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          const blocks = [...l.blocks];
          if (atIndex !== undefined) blocks.splice(atIndex, 0, block);
          else blocks.push(block);
          return { ...l, blocks };
        });
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
        return block.id;
      },

      updateBlock: (courseId, lessonId, blockId, patch) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const lessons = data.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          return {
            ...l,
            blocks: l.blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)),
          };
        });
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
      },

      deleteBlock: (courseId, lessonId, blockId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const lessons = data.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          return { ...l, blocks: l.blocks.filter((b) => b.id !== blockId) };
        });
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
      },

      duplicateBlock: (courseId, lessonId, blockId) => {
        const data = get().courseData[courseId];
        if (!data) return "";
        let newId = "";
        const lessons = data.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          const idx = l.blocks.findIndex((b) => b.id === blockId);
          if (idx < 0) return l;
          const clone = cloneBlockDeep(l.blocks[idx]);
          newId = clone.id;
          const blocks = [...l.blocks];
          blocks.splice(idx + 1, 0, clone);
          return { ...l, blocks };
        });
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
        return newId;
      },

      reorderBlocks: (courseId, lessonId, fromId, toId) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const lessons = data.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          return { ...l, blocks: reorderArray(l.blocks, fromId, toId) };
        });
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
      },

      moveBlockToIndex: (courseId, lessonId, blockId, newIndex) => {
        const data = get().courseData[courseId];
        if (!data) return;
        const lessons = data.lessons.map((l) => {
          if (l.id !== lessonId) return l;
          const blocks = [...l.blocks];
          const oldIndex = blocks.findIndex((b) => b.id === blockId);
          if (oldIndex < 0) return l;
          const [moved] = blocks.splice(oldIndex, 1);
          blocks.splice(newIndex, 0, moved);
          return { ...l, blocks };
        });
        set({
          courseData: { ...get().courseData, [courseId]: { ...data, lessons } },
        });
      },
    }),
    { name: "gk-course" },
  ),
);
