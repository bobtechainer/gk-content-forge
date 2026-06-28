import { z } from "zod";
import type { CourseBlock, CourseBlockType } from "@/stores/course";
import type { LearningMaterialSubtype } from "@/lib/types";
import type { CourseTheme } from "@/lib/theme/resolve";
import { SYSTEM_THEMES } from "@/lib/theme/system-themes";
import { ramp } from "@/lib/theme/color";
import type {
  AiClient,
  ChatReplyRequest,
  CompanionRequest,
  FillRequest,
  GeneratedMaterial,
  GenerateMaterialRequest,
  QuizFromContentRequest,
  Storyboard,
  StoryboardItem,
  StoryboardRequest,
  UiSystemRequest,
  UiSystemResult,
} from "./types";

/* ─── Deterministic hash ──────────────────────────────────────────── */

/** Tiny deterministic hash of a string → unsigned 32-bit int. */
function djb2(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Stable sequential id based on a prefix + index + seed string. */
function stableId(prefix: string, index: number, seed: string): string {
  const h = djb2(`${seed}:${prefix}:${index}`).toString(16).padStart(8, "0");
  return `${prefix}_mock_${h}`;
}

/* ─── Zod validation schemas ──────────────────────────────────────── */

const VALID_BLOCK_TYPES: CourseBlockType[] = [
  "text",
  "image",
  "video",
  "callout",
  "divider",
  "embed",
  "code",
  "math",
  "columns",
  "quiz",
  "html",
  "section",
  "accordion",
  "process",
  "flashcards",
];

const courseBlockTypeSchema = z.enum(VALID_BLOCK_TYPES as [CourseBlockType, ...CourseBlockType[]]);

const storyboardItemSchema = z.object({
  id: z.string().min(1),
  blockType: courseBlockTypeSchema,
  intent: z.string().min(1),
  learningGoal: z.string().min(1),
});

const storyboardSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  items: z.array(storyboardItemSchema).min(1),
});

const storyboardSchema = z.object({
  sections: z.array(storyboardSectionSchema).min(1),
});

const fillPatchBaseSchema = z.object({
  type: courseBlockTypeSchema,
});

const quizFillSchema = z
  .object({
    type: z.literal("quiz"),
    content: z.string().min(1),
    quizOptions: z.array(z.string()).min(2),
    quizCorrect: z.number().int().nonnegative(),
    quizExplanation: z.string(),
  })
  .refine((q) => q.quizCorrect < q.quizOptions.length, {
    message: "quizCorrect out of range",
    path: ["quizCorrect"],
  });

const quizItemSchema = z.object({
  content: z.string().min(1),
  quizOptions: z.array(z.string()).min(2),
  quizCorrect: z.number().int().min(0),
  quizExplanation: z.string(),
});

/* ─── Storyboard from source text ───────────────────────────────── */

const MAX_SOURCE_SECTIONS = 6;

/**
 * Split sourceText into paragraphs. Splits on blank lines or markdown headings
 * (lines starting with #). Trims each chunk. Caps at MAX_SOURCE_SECTIONS.
 */
function splitIntoParagraphs(text: string): string[] {
  const lines = text.split("\n");
  const chunks: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    const isHeading = /^#{1,6}\s/.test(line.trim());
    const isBlank = line.trim() === "";

    if (isBlank || isHeading) {
      if (current.length > 0) {
        chunks.push(current.join("\n").trim());
        current = [];
      }
      if (isHeading) {
        current.push(line);
      }
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) {
    chunks.push(current.join("\n").trim());
  }

  return chunks.filter(Boolean).slice(0, MAX_SOURCE_SECTIONS);
}

/** Extract a short title from the first sentence / line of a paragraph. Max 60 chars. */
function titleFromParagraph(para: string): string {
  const firstLine = para.split("\n")[0].replace(/^#{1,6}\s*/, "").trim();
  const firstSentence = firstLine.split(/[.!?。]/)[0].trim();
  const raw = firstSentence || firstLine;
  const safe = raw.trim() || "Đoạn văn";
  return safe.length > 60 ? safe.slice(0, 57) + "..." : safe;
}

function buildStoryboardFromText(req: StoryboardRequest): Storyboard {
  const paragraphs = splitIntoParagraphs(req.sourceText!);
  const seed = `${req.subject}|${req.grade}|${req.topic}|${req.sourceText}`;

  const sections = paragraphs.map((para, secIdx) => {
    const title = titleFromParagraph(para);
    const firstSentence = para.split(/[.!?。\n]/)[0].trim();

    const items: StoryboardItem[] = [
      {
        id: stableId("item", secIdx * 2, seed),
        blockType: "text" as CourseBlockType,
        intent: `Trình bày nội dung: "${firstSentence}"`,
        learningGoal: `Học sinh nắm được ý chính của đoạn: ${firstSentence.slice(0, 60)}`,
      },
    ];

    // Every other section gets an additional quiz item
    if (secIdx % 2 === 1) {
      items.push({
        id: stableId("item", secIdx * 2 + 1, seed),
        blockType: "quiz" as CourseBlockType,
        intent: `Kiểm tra hiểu bài đoạn: "${firstSentence.slice(0, 40)}"`,
        learningGoal: `Học sinh trả lời đúng câu hỏi về nội dung đoạn ${secIdx + 1}`,
      });
    }

    return {
      id: stableId("sec", secIdx, seed),
      title,
      items,
    };
  });

  const storyboard: Storyboard = { sections };
  return storyboardSchema.parse(storyboard);
}

/* ─── Storyboard generator ───────────────────────────────────────── */

function buildStoryboard(req: StoryboardRequest): Storyboard {
  if (req.sourceText && req.sourceText.trim().length > 0) {
    return buildStoryboardFromText(req);
  }

  const seed = `${req.subject}|${req.grade}|${req.topic}`;
  const topic = req.topic;
  const subject = req.subject;

  const sections = [
    {
      id: stableId("sec", 0, seed),
      title: "Khởi động",
      items: [
        {
          id: stableId("item", 0, seed),
          blockType: "text" as CourseBlockType,
          intent: `Giới thiệu chủ đề "${topic}" để kích hoạt kiến thức nền của học sinh`,
          learningGoal: `Học sinh nhận biết được khái niệm cơ bản về ${topic} trong môn ${subject}`,
        },
      ] satisfies StoryboardItem[],
    },
    {
      id: stableId("sec", 1, seed),
      title: "Khám phá",
      items: [
        {
          id: stableId("item", 1, seed),
          blockType: "section" as CourseBlockType,
          intent: `Đánh dấu phần nội dung chính về ${topic}`,
          learningGoal: `Phân chia bài học thành các phần học rõ ràng`,
        },
        {
          id: stableId("item", 2, seed),
          blockType: "text" as CourseBlockType,
          intent: `Giải thích chi tiết khái niệm và quy tắc của ${topic}`,
          learningGoal: `Học sinh hiểu và trình bày được định nghĩa, tính chất của ${topic}`,
        },
        {
          id: stableId("item", 3, seed),
          blockType: "callout" as CourseBlockType,
          intent: `Nhấn mạnh lưu ý quan trọng khi học về ${topic}`,
          learningGoal: `Học sinh ghi nhớ điểm mấu chốt dễ nhầm lẫn liên quan đến ${topic}`,
        },
      ] satisfies StoryboardItem[],
    },
    {
      id: stableId("sec", 2, seed),
      title: "Luyện tập",
      items: [
        {
          id: stableId("item", 4, seed),
          blockType: "quiz" as CourseBlockType,
          intent: `Kiểm tra mức độ hiểu bài về ${topic} qua câu hỏi trắc nghiệm`,
          learningGoal: `Học sinh vận dụng kiến thức ${topic} để trả lời đúng câu hỏi`,
        },
        {
          id: stableId("item", 5, seed),
          blockType: "flashcards" as CourseBlockType,
          intent: `Ôn luyện thuật ngữ và khái niệm quan trọng của ${topic}`,
          learningGoal: `Học sinh ghi nhớ từ vựng và định nghĩa cốt lõi của ${topic}`,
        },
      ] satisfies StoryboardItem[],
    },
    {
      id: stableId("sec", 3, seed),
      title: "Tổng kết",
      items: [
        {
          id: stableId("item", 6, seed),
          blockType: "text" as CourseBlockType,
          intent: `Tóm tắt những điểm chính đã học về ${topic}`,
          learningGoal: `Học sinh hệ thống hóa được toàn bộ kiến thức ${topic} trong bài học`,
        },
      ] satisfies StoryboardItem[],
    },
  ];

  const storyboard: Storyboard = { sections };
  return storyboardSchema.parse(storyboard);
}

/* ─── FillBlock ──────────────────────────────────────────────────── */

function buildFillPatch(req: FillRequest): Partial<CourseBlock> {
  const { item, topic } = req;
  const type = item.blockType;

  let patch: Partial<CourseBlock>;

  switch (type) {
    case "text":
      patch = {
        type: "text",
        content: `<p>Trong bài học này, chúng ta cùng tìm hiểu về <strong>${topic}</strong>.</p><p>${item.intent}</p>`,
      };
      break;

    case "callout":
      patch = {
        type: "callout",
        content: `<p><strong>Lưu ý quan trọng:</strong> Khi học về ${topic}, cần chú ý ${item.intent.toLowerCase()}.</p>`,
        calloutVariant: "tip",
      };
      break;

    case "quiz": {
      const quizOptions = [
        `${topic} là khái niệm cơ bản trong ${req.subject}`,
        `${topic} không liên quan đến ${req.subject}`,
        `${topic} chỉ áp dụng trong điều kiện đặc biệt`,
      ];
      patch = {
        type: "quiz",
        content: `Câu nào sau đây mô tả đúng nhất về ${topic}?`,
        quizOptions,
        quizCorrect: djb2(req.item.id + req.topic) % quizOptions.length,
        quizExplanation: `Đúng! ${topic} là một khái niệm cơ bản và quan trọng trong môn ${req.subject} ${req.grade}.`,
      };
      quizFillSchema.parse(patch);
      break;
    }

    case "flashcards":
      patch = {
        type: "flashcards",
        content: "",
        flashcards: [
          { id: stableId("card", 0, topic), front: `Định nghĩa ${topic}`, back: `${topic} là khái niệm quan trọng trong ${req.subject}, được dạy ở ${req.grade}.` },
          { id: stableId("card", 1, topic), front: `Ví dụ về ${topic}`, back: `Ví dụ điển hình của ${topic} trong thực tế cuộc sống hàng ngày.` },
        ],
      };
      break;

    case "process":
      patch = {
        type: "process",
        content: "",
        processSteps: [
          { id: stableId("step", 0, topic), title: `Bước 1: Nhận biết ${topic}`, body: `Xác định và nhận biết ${topic} trong bài toán hoặc tình huống thực tế.` },
          { id: stableId("step", 1, topic), title: `Bước 2: Phân tích ${topic}`, body: `Phân tích các thành phần và tính chất của ${topic}.` },
          { id: stableId("step", 2, topic), title: `Bước 3: Áp dụng ${topic}`, body: `Vận dụng kiến thức về ${topic} để giải quyết bài tập.` },
        ],
      };
      break;

    case "accordion":
      patch = {
        type: "accordion",
        content: "",
        accordionItems: [
          { id: stableId("acc", 0, topic), title: `Khái niệm ${topic}`, body: `${topic} được định nghĩa là... (nội dung chi tiết về khái niệm).` },
          { id: stableId("acc", 1, topic), title: `Tính chất của ${topic}`, body: `Các tính chất cơ bản của ${topic} bao gồm...` },
          { id: stableId("acc", 2, topic), title: `Ứng dụng của ${topic}`, body: `${topic} được ứng dụng trong thực tiễn như...` },
        ],
      };
      break;

    case "section":
      patch = {
        type: "section",
        content: topic,
      };
      break;

    case "image":
      patch = {
        type: "image",
        content: "",
        caption: `Hình minh họa về ${topic}`,
      };
      break;

    case "video":
      patch = {
        type: "video",
        content: "",
        caption: `Video bài giảng về ${topic}`,
      };
      break;

    case "code":
      patch = {
        type: "code",
        content: `// Ví dụ minh họa ${topic}\nconsole.log("${topic}");`,
        codeLanguage: "javascript",
      };
      break;

    case "math":
      patch = {
        type: "math",
        content: `\\text{${topic}}`,
      };
      break;

    case "embed":
      patch = {
        type: "embed",
        content: "",
        embedTitle: `Tài liệu về ${topic}`,
        embedType: "document",
      };
      break;

    case "html":
      patch = {
        type: "html",
        content: `<div style="padding:24px;font-family:sans-serif;text-align:center"><h2>${topic}</h2><p>Nội dung tương tác về ${topic}</p></div>`,
      };
      break;

    case "columns":
      patch = {
        type: "columns",
        content: "",
        columnCount: 2,
        columnChildren: [[], []],
      };
      break;

    case "divider":
    default:
      patch = { type };
      break;
  }

  fillPatchBaseSchema.parse(patch);
  return patch;
}

/* ─── CompanionEdit ──────────────────────────────────────────────── */

function shortenText(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  const targetLen = Math.max(1, Math.floor(words.length * 0.6));
  return words.slice(0, targetLen).join(" ");
}

function lengthenText(text: string): string {
  return `${text} Điều này rất quan trọng để học sinh nắm vững kiến thức và vận dụng vào thực tiễn.`;
}

function toFriendlyTone(text: string): string {
  return `Bạn ơi, ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

function toFormalTone(text: string): string {
  const trimmed = text.replace(/^bạn ơi,?\s*/i, "");
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

function fixText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
}

/* ─── QuizFromContent ────────────────────────────────────────────── */

function extractKeywords(text: string): string[] {
  return text
    .split(/[\s,.;:!?()\[\]{}"]+/)
    .filter((w) => w.length >= 4)
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 20);
}

function buildQuizFromContent(
  req: QuizFromContentRequest,
): { content: string; quizOptions: string[]; quizCorrect: number; quizExplanation: string }[] {
  const { sourceText, count } = req;
  const keywords = extractKeywords(sourceText);
  const seed = djb2(sourceText);

  const results = Array.from({ length: count }, (_, i) => {
    const kwIndex = (seed + i) % Math.max(keywords.length, 1);
    const kw = keywords[kwIndex] ?? `khái niệm ${i + 1}`;
    const distractorA = keywords[(kwIndex + 1) % Math.max(keywords.length, 1)] ?? "khái niệm A";
    const distractorB = keywords[(kwIndex + 2) % Math.max(keywords.length, 1)] ?? "khái niệm B";

    const item = {
      content: `Trong đoạn văn trên, "${kw}" được hiểu là gì?`,
      quizOptions: [
        `${kw} là khái niệm cốt lõi được đề cập trong nội dung`,
        `${distractorA} và ${kw} là hai khái niệm hoàn toàn giống nhau`,
        `${distractorB} thay thế hoàn toàn cho ${kw}`,
      ],
      quizCorrect: 0,
      quizExplanation: `Theo nội dung bài, "${kw}" là một khái niệm quan trọng được đề cập trực tiếp.`,
    };

    return quizItemSchema.parse(item);
  });

  return results;
}

/* ─── GenerateMaterial (9 loại học liệu trong kho) ───────────────── */

const MATERIAL_KIND_LABELS: Record<LearningMaterialSubtype, string> = {
  quiz: "Bộ đề",
  lesson: "Bài giảng",
  advanced: "Học liệu nâng cao",
  scorm: "Gói SCORM/xAPI",
  document: "Tài liệu",
  video: "Video",
  image: "Hình ảnh",
  audio: "Âm thanh",
  "3d_vr": "Mô hình 3D/VR",
};

function buildMaterial(req: GenerateMaterialRequest): GeneratedMaterial {
  const { kind, topic } = req;
  const subject = req.subject?.trim() || "";
  const grade = req.grade?.trim() || "";
  const gradeSuffix = grade ? ` (${grade})` : "";

  const byKind: Record<
    LearningMaterialSubtype,
    { title: string; description: string; highlights: string[] }
  > = {
    quiz: {
      title: `Bộ đề: ${topic}`,
      description: `Bộ câu hỏi trắc nghiệm bám sát chủ đề ${topic}${gradeSuffix}, phân tầng từ nhận biết đến vận dụng.`,
      highlights: ["10 câu trắc nghiệm 4 đáp án", "Có lời giải cho từng câu", "Phân tầng nhận biết → vận dụng cao"],
    },
    lesson: {
      title: `Bài giảng: ${topic}`,
      description: `Bài giảng tương tác về ${topic}${gradeSuffix}, gồm dẫn nhập, kiến thức trọng tâm và luyện tập.`,
      highlights: ["Dàn ý 4 phần theo tiến trình lên lớp", "Sơ đồ trực quan và ví dụ thực tế", "Câu hỏi củng cố cuối bài"],
    },
    advanced: {
      title: `Học liệu tương tác: ${topic}`,
      description: `Gói HTML tương tác mô phỏng ${topic}${gradeSuffix}, học sinh thao tác trực tiếp.`,
      highlights: ["Mô phỏng kéo-thả trực quan", "Phản hồi tức thì khi thao tác", "Chạy được offline trong trình duyệt"],
    },
    scorm: {
      title: `Gói SCORM: ${topic}`,
      description: `Gói SCORM đóng gói bài ${topic}${gradeSuffix} để nhúng vào hệ thống LMS.`,
      highlights: ["Chuẩn SCORM 1.2 / xAPI", "Theo dõi tiến độ và điểm số", "Nhúng được vào mọi LMS"],
    },
    document: {
      title: `Tài liệu: ${topic}`,
      description: `Tài liệu tóm tắt lý thuyết ${topic}${gradeSuffix} kèm công thức và ví dụ mẫu.`,
      highlights: ["Tóm tắt lý thuyết trọng tâm", "Bảng công thức và ví dụ mẫu", "Tải xuống / in PDF được"],
    },
    video: {
      title: `Video bài giảng: ${topic}`,
      description: `Kịch bản video ${topic}${gradeSuffix} dài khoảng 6 phút, có phân cảnh và lời thoại.`,
      highlights: ["Kịch bản 6 phút có phân cảnh", "Lời thoại kèm gợi ý hình ảnh", "Phụ đề tiếng Việt"],
    },
    image: {
      title: `Hình minh hoạ: ${topic}`,
      description: `Bộ sơ đồ và hình minh hoạ cho chủ đề ${topic}${gradeSuffix}.`,
      highlights: ["Sơ đồ tư duy chủ đề", "Infographic tóm tắt", "Chú thích rõ ràng"],
    },
    audio: {
      title: `Âm thanh: ${topic}`,
      description: `Bản thu giọng đọc nội dung ${topic}${gradeSuffix}, phù hợp ôn tập.`,
      highlights: ["Giọng đọc rõ ràng ~5 phút", "Nhạc nền nhẹ", "Nghe lại khi di chuyển"],
    },
    "3d_vr": {
      title: `Mô hình 3D: ${topic}`,
      description: `Mô hình 3D/VR tương tác giúp quan sát ${topic}${gradeSuffix} ở mọi góc nhìn.`,
      highlights: ["Xoay / phóng to 360°", "Điểm nóng chú thích (hotspot)", "Xem được bằng kính VR"],
    },
  };

  const c = byKind[kind];
  return {
    kind,
    title: c.title,
    description: c.description,
    tags: [subject, topic, MATERIAL_KIND_LABELS[kind]].filter(Boolean),
    highlights: c.highlights,
  };
}

/* ─── GenerateUiSystem (giao diện khoá học) ──────────────────────── */

const VIBE_ACCENTS: Record<string, string> = {
  "Tươi sáng": "#15B79E",
  "Trang trọng": "#1F3A8A",
  "Tối giản": "#334155",
  "Vui nhộn": "#F59E0B",
};

const DENSITY_LABELS: Record<string, string> = {
  compact: "gọn gàng",
  cozy: "cân đối",
  spacious: "thoáng đãng",
};

function pickThemeBase(text: string): string {
  const t = text.toLowerCase();
  if (/(mầm non|mam non|vui nhộn|bé|trẻ|sắc màu|nhí)/.test(t)) return "mam-non";
  if (/(stem|khoa học|hoá|hóa|vật l[ýy]|sinh học|toán|công nghệ|kỹ thuật|lab)/.test(t)) return "stem";
  if (/(văn|sử|địa|nhân văn|trang trọng|cổ điển|lịch sử|triết)/.test(t)) return "humanities";
  if (/(tối|dark|đêm|ban đêm)/.test(t)) return "dark";
  if (/(trung học|thpt|thcs|năng động|tươi sáng|tươi)/.test(t)) return "trung-hoc";
  return "mobifone-default";
}

function buildUiSystem(req: UiSystemRequest): UiSystemResult {
  const base = pickThemeBase(`${req.description} ${req.subject ?? ""} ${req.vibe ?? ""}`);
  const baseTheme = SYSTEM_THEMES[base];
  const accent = (req.vibe && VIBE_ACCENTS[req.vibe]) || baseTheme.accentSeed;
  const theme: CourseTheme = { ...baseTheme, base: "custom", accentSeed: accent };
  const r = ramp(accent);
  const name = req.vibe ? `${req.vibe} · ${req.subject || "khoá học"}` : `Giao diện cho ${req.subject || "khoá học"}`;
  const density = DENSITY_LABELS[theme.density] ?? "cân đối";
  const seed = (req.description || req.subject || "khoá học").trim();
  const rationale = `Mình chọn tông màu này với bố cục ${density}, bo góc ${theme.radiusStep}px${theme.mode === "dark" ? " và nền tối" : ""} — hợp với "${seed}". Bạn có thể tinh chỉnh thêm bên trái rồi áp dụng.`;
  return { name, theme, rationale, palette: [r.soft, r.accent, r.strong] };
}

/* ─── ChatReply (hội thoại ngắn) ─────────────────────────────────── */

function buildChatReply(req: ChatReplyRequest): { text: string } {
  const topic = req.topic?.trim();
  const about = topic ? ` về "${topic}"` : "";
  const byMode: Record<ChatReplyRequest["mode"], string> = {
    content: `Được, mình viết nội dung${about} ngay. Bạn xem rồi chèn vào bài nhé.`,
    "full-lesson": `Để mình dựng cả bài${about}: phác dàn ý, viết từng phần rồi đổ lên canvas giúp bạn.`,
    quiz: `Mình tạo vài câu hỏi${about} bám nội dung bài để kiểm tra mức độ hiểu nhé.`,
    flashcards: `Mình làm một bộ thẻ ghi nhớ${about} cho phần ôn tập.`,
    material: `Mình tạo học liệu${about} rồi lưu vào kho để bạn dùng lại sau.`,
    rewrite: `Mình soạn lại đoạn này cho rõ ràng và mạch lạc hơn nhé.`,
  };
  return { text: byMode[req.mode] };
}

/* ─── mockAiClient ───────────────────────────────────────────────── */

export const mockAiClient: AiClient = {
  async generateStoryboard(req: StoryboardRequest) {
    return buildStoryboard(req);
  },

  async fillBlock(req: FillRequest) {
    return buildFillPatch(req);
  },

  async companionEdit(req: CompanionRequest) {
    const { text, action } = req;
    switch (action) {
      case "shorten":
        return { text: shortenText(text) };
      case "lengthen":
        return { text: lengthenText(text) };
      case "tone-friendly":
        return { text: toFriendlyTone(text) };
      case "tone-formal":
        return { text: toFormalTone(text) };
      case "fix":
        return { text: fixText(text) };
      default:
        return { text };
    }
  },

  async quizFromContent(req: QuizFromContentRequest) {
    return buildQuizFromContent(req);
  },

  async generateMaterial(req: GenerateMaterialRequest) {
    return buildMaterial(req);
  },

  async generateUiSystem(req: UiSystemRequest) {
    return buildUiSystem(req);
  },

  async chatReply(req: ChatReplyRequest) {
    return buildChatReply(req);
  },
};
