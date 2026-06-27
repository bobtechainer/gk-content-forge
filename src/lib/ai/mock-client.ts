import { z } from "zod";
import type { CourseBlock, CourseBlockType } from "@/stores/course";
import type {
  AiClient,
  CompanionRequest,
  FillRequest,
  QuizFromContentRequest,
  Storyboard,
  StoryboardItem,
  StoryboardRequest,
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
};
