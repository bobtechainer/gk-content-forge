/**
 * Thư viện ảnh minh hoạ cảnh cho Storyboard — illustration phẳng dựng sẵn (SVG),
 * đóng gói trong app, không gọi mạng/backend. Mỗi cảnh là một key.
 *
 * Đây là LỚP ASSET tách riêng: sau này muốn thay bằng ảnh nano-banana thật, chỉ
 * cần đổi `SCENE_ART[key]` sang URL ảnh PNG/WebP — phần còn lại không phải sửa.
 */

export type SceneKey =
  | "engage"
  | "explore"
  | "explain"
  | "lab"
  | "nature"
  | "physics"
  | "math"
  | "reading"
  | "history"
  | "geography"
  | "assess"
  | "recap"
  | "video"
  | "discuss";

const VB = 'viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg"';

/** Khung nền chung: trời gradient + mặt trời mờ + đồi mềm → tạo cảm giác một "bộ". */
function art(id: string, top: string, bottom: string, accent: string, motif: string): string {
  return (
    `<svg ${VB}>` +
    `<defs><linearGradient id="sky_${id}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs>` +
    `<rect width="320" height="200" fill="url(#sky_${id})"/>` +
    `<circle cx="258" cy="50" r="30" fill="#ffffff" opacity="0.22"/>` +
    `<path d="M0 156 Q80 126 162 150 T320 144 V200 H0 Z" fill="#ffffff" opacity="0.16"/>` +
    `<path d="M0 172 Q90 150 180 168 T320 162 V200 H0 Z" fill="${accent}" opacity="0.20"/>` +
    motif +
    `</svg>`
  );
}

/** Mỗi cảnh: gradient riêng + motif trung tâm đơn giản, dễ nhận. */
const RAW: Record<SceneKey, string> = {
  engage: art(
    "engage", "#FFE9C7", "#FFC97A", "#E8821E",
    // bóng đèn ý tưởng
    `<g transform="translate(160 96)"><circle r="30" fill="#FFF3D6"/><circle r="30" fill="none" stroke="#E8821E" stroke-width="4"/>` +
      `<rect x="-12" y="26" width="24" height="14" rx="3" fill="#C9700F"/><rect x="-9" y="40" width="18" height="6" rx="3" fill="#9C560B"/>` +
      `<path d="M-6 -2 L0 8 L6 -2" fill="none" stroke="#E8821E" stroke-width="3" stroke-linecap="round"/>` +
      `<g stroke="#E8821E" stroke-width="3" stroke-linecap="round"><line x1="0" y1="-44" x2="0" y2="-54"/><line x1="34" y1="-28" x2="44" y2="-34"/><line x1="-34" y1="-28" x2="-44" y2="-34"/></g></g>`,
  ),
  explore: art(
    "explore", "#CFF3EE", "#76D8C7", "#0E9384",
    // kính lúp
    `<g transform="translate(150 92)"><circle r="34" fill="#EAFBF7"/><circle r="34" fill="none" stroke="#0E9384" stroke-width="5"/>` +
      `<circle r="20" fill="none" stroke="#5FC9B8" stroke-width="3"/><rect x="22" y="22" width="30" height="12" rx="6" transform="rotate(45 22 22)" fill="#0B7C70"/></g>`,
  ),
  explain: art(
    "explain", "#D7EFE0", "#8FD3AC", "#1A7F4B",
    // bảng phấn
    `<g transform="translate(70 56)"><rect width="180" height="100" rx="8" fill="#22543D"/><rect x="8" y="8" width="164" height="84" rx="5" fill="#2F6B4F"/>` +
      `<g stroke="#DCEFE3" stroke-width="4" stroke-linecap="round"><line x1="26" y1="34" x2="120" y2="34"/><line x1="26" y1="52" x2="150" y2="52"/><line x1="26" y1="70" x2="96" y2="70"/></g></g>`,
  ),
  lab: art(
    "lab", "#E6DBFB", "#B59CF0", "#6938EF",
    // bình thí nghiệm
    `<g transform="translate(160 100)"><path d="M-10 -36 H10 V-10 L26 30 Q30 42 16 42 H-16 Q-30 42 -26 30 L-10 -10 Z" fill="#F3EEFE" stroke="#6938EF" stroke-width="4"/>` +
      `<path d="M-20 16 L20 16 L26 30 Q30 42 16 42 H-16 Q-30 42 -26 30 Z" fill="#9B7DF0"/>` +
      `<circle cx="2" cy="26" r="3" fill="#F3EEFE"/><circle cx="-8" cy="32" r="2" fill="#F3EEFE"/><rect x="-13" y="-42" width="26" height="7" rx="3" fill="#5526C9"/></g>`,
  ),
  nature: art(
    "nature", "#DBF1D0", "#8FD06A", "#3F8E2A",
    // chiếc lá
    `<g transform="translate(160 98)"><path d="M0 36 C-40 18 -36 -34 0 -40 C36 -34 40 18 0 36 Z" fill="#5FB13A"/>` +
      `<path d="M0 36 C-40 18 -36 -34 0 -40" fill="#76C24F"/>` +
      `<line x1="0" y1="36" x2="0" y2="-38" stroke="#2F7320" stroke-width="3"/>` +
      `<g stroke="#2F7320" stroke-width="2"><line x1="0" y1="6" x2="-20" y2="-6"/><line x1="0" y1="-8" x2="18" y2="-20"/><line x1="0" y1="-22" x2="-14" y2="-32"/></g></g>`,
  ),
  physics: art(
    "physics", "#D9E0FB", "#9FB0F0", "#3538CD",
    // nguyên tử
    `<g transform="translate(160 98)"><circle r="9" fill="#3538CD"/>` +
      `<g fill="none" stroke="#4A56E0" stroke-width="3"><ellipse rx="42" ry="16"/><ellipse rx="42" ry="16" transform="rotate(60)"/><ellipse rx="42" ry="16" transform="rotate(120)"/></g>` +
      `<circle cx="42" cy="0" r="5" fill="#2A2FB0"/><circle cx="-21" cy="36" r="5" fill="#2A2FB0"/></g>`,
  ),
  math: art(
    "math", "#CFE6FB", "#7FB6EE", "#175CD3",
    // biểu đồ cột
    `<g transform="translate(86 60)"><line x1="0" y1="0" x2="0" y2="86" stroke="#175CD3" stroke-width="4"/><line x1="0" y1="86" x2="150" y2="86" stroke="#175CD3" stroke-width="4"/>` +
      `<rect x="20" y="52" width="22" height="34" rx="3" fill="#4E94E8"/><rect x="54" y="34" width="22" height="52" rx="3" fill="#2E77DC"/><rect x="88" y="16" width="22" height="70" rx="3" fill="#175CD3"/>` +
      `<polyline points="20,48 65,30 99,14 132,6" fill="none" stroke="#0B3F9E" stroke-width="3" stroke-linecap="round"/></g>`,
  ),
  reading: art(
    "reading", "#FBE0E6", "#F09FB3", "#C01753",
    // sách mở
    `<g transform="translate(160 100)"><path d="M0 -28 C-22 -40 -54 -36 -64 -28 V32 C-54 24 -22 28 0 40 Z" fill="#FFF1F4" stroke="#C01753" stroke-width="3"/>` +
      `<path d="M0 -28 C22 -40 54 -36 64 -28 V32 C54 24 22 28 0 40 Z" fill="#FFFFFF" stroke="#C01753" stroke-width="3"/>` +
      `<g stroke="#F2A9BC" stroke-width="2"><line x1="-52" y1="-18" x2="-12" y2="-12"/><line x1="-52" y1="-4" x2="-12" y2="2"/><line x1="12" y1="-12" x2="52" y2="-18"/><line x1="12" y1="2" x2="52" y2="-4"/></g></g>`,
  ),
  history: art(
    "history", "#F2E8D5", "#D8BE8E", "#92702A",
    // cột cổ điển
    `<g transform="translate(160 54)"><rect x="-34" y="0" width="68" height="10" rx="2" fill="#7A5C1F"/><rect x="-28" y="10" width="56" height="8" fill="#A9853A"/>` +
      `<g fill="#C8A766"><rect x="-22" y="18" width="10" height="74"/><rect x="-5" y="18" width="10" height="74"/><rect x="12" y="18" width="10" height="74"/></g>` +
      `<rect x="-30" y="92" width="60" height="10" rx="2" fill="#7A5C1F"/></g>`,
  ),
  geography: art(
    "geography", "#CFEFF5", "#7FD0E0", "#0B7C8C",
    // quả địa cầu
    `<g transform="translate(160 98)"><circle r="40" fill="#9FE0EA"/><circle r="40" fill="none" stroke="#0B7C8C" stroke-width="4"/>` +
      `<g fill="#4FB6C6"><path d="M-30 -10 q14 -16 30 -6 q-6 14 -22 14 q-12 -2 -8 -8 Z"/><path d="M4 8 q18 -4 24 10 q-10 14 -26 8 q-6 -12 2 -18 Z"/></g>` +
      `<g fill="none" stroke="#0B7C8C" stroke-width="2" opacity="0.7"><ellipse rx="40" ry="15"/><line x1="0" y1="-40" x2="0" y2="40"/></g></g>`,
  ),
  assess: art(
    "assess", "#D6F2E2", "#83D6AB", "#0E9F6E",
    // bảng kiểm + tick
    `<g transform="translate(108 50)"><rect width="104" height="100" rx="8" fill="#FFFFFF" stroke="#0E9F6E" stroke-width="3"/>` +
      `<g><rect x="16" y="22" width="14" height="14" rx="3" fill="#0E9F6E"/><path d="M19 29 l3 4 l6 -8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="40" y1="29" x2="86" y2="29" stroke="#BFE6D2" stroke-width="4" stroke-linecap="round"/></g>` +
      `<g><rect x="16" y="46" width="14" height="14" rx="3" fill="#0E9F6E"/><path d="M19 53 l3 4 l6 -8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/><line x1="40" y1="53" x2="86" y2="53" stroke="#BFE6D2" stroke-width="4" stroke-linecap="round"/></g>` +
      `<g><rect x="16" y="70" width="14" height="14" rx="3" fill="none" stroke="#0E9F6E" stroke-width="3"/><line x1="40" y1="77" x2="74" y2="77" stroke="#BFE6D2" stroke-width="4" stroke-linecap="round"/></g></g>`,
  ),
  recap: art(
    "recap", "#FFE6CC", "#FBB979", "#DC6803",
    // cờ tổng kết trên đỉnh
    `<g transform="translate(132 50)"><line x1="0" y1="0" x2="0" y2="100" stroke="#9A4A05" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M0 4 L64 18 L0 36 Z" fill="#F79009"/><path d="M0 4 L64 18 L0 20 Z" fill="#FDB022"/><circle cx="0" cy="0" r="6" fill="#DC6803"/></g>`,
  ),
  video: art(
    "video", "#D7DCE6", "#9AA6BC", "#3A4860",
    // màn hình play
    `<g transform="translate(94 54)"><rect width="132" height="86" rx="10" fill="#2B3650"/><rect x="8" y="8" width="116" height="70" rx="6" fill="#48577A"/>` +
      `<path d="M56 30 L82 43 L56 56 Z" fill="#FFFFFF"/><rect x="40" y="92" width="52" height="6" rx="3" fill="#2B3650"/></g>`,
  ),
  discuss: art(
    "discuss", "#D4E6FB", "#88B6EE", "#1763C6",
    // hai bong bóng hội thoại
    `<g><path d="M58 64 h84 a12 12 0 0 1 12 12 v34 a12 12 0 0 1 -12 12 h-50 l-18 16 v-16 h-16 a12 12 0 0 1 -12 -12 v-34 a12 12 0 0 1 12 -12 Z" fill="#FFFFFF" stroke="#1763C6" stroke-width="3"/>` +
      `<path d="M168 92 h66 a12 12 0 0 1 12 12 v26 a12 12 0 0 1 -12 12 h-12 v14 l-16 -14 h-38 a12 12 0 0 1 -12 -12 v-26 a12 12 0 0 1 12 -12 Z" fill="#DCEAFB" stroke="#1763C6" stroke-width="3"/>` +
      `<g fill="#1763C6"><circle cx="84" cy="93" r="4"/><circle cx="100" cy="93" r="4"/><circle cx="116" cy="93" r="4"/></g></g>`,
  ),
};

/** Trả về data-URI để dùng trong background-image hoặc <img src>. */
export function resolveSceneArt(key: SceneKey): string {
  const svg = RAW[key] ?? RAW.explain;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Nguồn ảnh cho một khung: nhận `image` đã lưu (khoá cảnh, hoặc URL/data-URI ảnh
 * thật sau này) và trả về src dùng được. Đây là điểm DUY NHẤT cần đổi khi thay
 * bằng ảnh nano-banana thật.
 */
export function sceneSrc(image?: string): string {
  if (!image) return resolveSceneArt("explain");
  if (image.startsWith("data:") || image.startsWith("http") || image.startsWith("/")) return image;
  return resolveSceneArt(image as SceneKey);
}

export const SCENE_KEYS = Object.keys(RAW) as SceneKey[];

/** Nhãn tiếng Việt cho từng cảnh (hiện khi đổi ảnh). */
export const SCENE_LABELS: Record<SceneKey, string> = {
  engage: "Khơi gợi",
  explore: "Khám phá",
  explain: "Giảng giải",
  lab: "Thí nghiệm",
  nature: "Tự nhiên",
  physics: "Vật lí",
  math: "Toán / biểu đồ",
  reading: "Đọc hiểu",
  history: "Lịch sử",
  geography: "Địa lí",
  assess: "Đánh giá",
  recap: "Tổng kết",
  video: "Video",
  discuss: "Thảo luận",
};

const KEYWORDS: Record<SceneKey, string[]> = {
  engage: ["khơi", "gắn kết", "engage", "tò mò", "tình huống", "dẫn nhập", "mở đầu", "giới thiệu"],
  explore: ["khám phá", "explore", "tìm tòi", "quan sát", "thí nghiệm thử", "đặt câu hỏi"],
  explain: ["giải thích", "explain", "khái niệm", "định nghĩa", "trình bày", "giảng", "lí thuyết", "nội dung"],
  lab: ["thí nghiệm", "phản ứng", "hoá", "hóa", "lab", "dung dịch", "chất"],
  nature: ["sinh", "tế bào", "cây", "lá", "môi trường", "thực vật", "động vật", "tự nhiên"],
  physics: ["vật lí", "vật lý", "lực", "nguyên tử", "năng lượng", "chuyển động", "điện"],
  math: ["toán", "biểu đồ", "đồ thị", "số liệu", "thống kê", "hàm", "phương trình", "tốc độ"],
  reading: ["đọc", "văn", "tác phẩm", "thơ", "truyện", "ngữ văn"],
  history: ["lịch sử", "sự kiện", "thời", "triều", "cổ"],
  geography: ["địa lí", "địa lý", "bản đồ", "khí hậu", "vùng", "quốc gia", "địa cầu"],
  assess: ["đánh giá", "kiểm tra", "câu hỏi", "quiz", "luyện đề", "bài tập", "evaluate"],
  recap: ["tổng kết", "ôn tập", "củng cố", "tóm tắt", "kết luận"],
  video: ["video", "clip", "phim", "xem"],
  discuss: ["thảo luận", "trao đổi", "nhóm", "tranh luận", "chia sẻ"],
};

/** Chọn cảnh hợp nhất theo nội dung mô tả + loại khối. */
export function pickSceneArt(text: string, blockType?: string): SceneKey {
  const t = (text || "").toLowerCase();
  for (const key of SCENE_KEYS) {
    if (KEYWORDS[key].some((kw) => t.includes(kw))) return key;
  }
  // Suy theo loại khối nếu không khớp từ khoá
  switch (blockType) {
    case "video": return "video";
    case "quiz": return "assess";
    case "flashcards": return "recap";
    case "image": return "explore";
    case "process": return "physics";
    case "callout": return "engage";
    default: return "explain";
  }
}
