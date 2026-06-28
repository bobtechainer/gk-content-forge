# Course Builder UI Redesign — TalentLMS-style

> Spec brainstormed 2026-06-28. Tất cả quyết định đã được user duyệt.

## Mục tiêu

Nâng cấp visual + UX của Course Builder từ plain/ugly → **warm, friendly, premium** (kiểu Notion/Canva) với đầy đủ animation, collapsible panels, và AI dual-mode interaction.

## 12 quyết định thiết kế

| # | Hạng mục | Quyết định |
|---|----------|-----------|
| 1 | Layout | Giữ 3 cột (Left Palette \| Center Canvas \| Right AI) + Bottom LessonStrip |
| 2 | Panel animation | Slide + resize (VS Code style), icon strip mỏng khi collapsed |
| 3 | Numbered components | Badge inline `5 · Quote` trên mỗi block, hiện khi hover/edit |
| 4 | AI model | Dual mode: Command bar (bottom) + Chat panel (right) |
| 5 | AI realism | Full streaming: typewriter ~30ms/char, thinking dots, stagger blocks |
| 6 | Left palette | Grouped collapsible sections (Figma), grid 2 cột, count badges |
| 7 | Bottom strip | Giữ, upgrade visual + slide up/down animation |
| 8 | Design tone | Warm & Friendly — rounded 12-16px, pastel accents, approachable |
| 9 | AI actions | 15 actions: tạo trang, viết, hình ảnh, video, audio, 3D, flashcards, quiz... |
| 10 | Chat bar | Input + "+" menu (file, paste, SGK, URL) + action dropdown + send |
| 11 | Canvas view | Activity list (1 dòng/block, numbered sections) thay block cards |
| 12 | Activity editor | Full-page overlay + breadcrumb back khi click activity |

---

## Chi tiết thiết kế

### 1. Layout tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│ Header: ← | [C] | Title input | Preview/Edit | Publish     │
├──────┬──────────────────────────────────┬───────────────────┤
│      │                                  │                   │
│ Left │       Center Canvas              │  Right Panel      │
│Panel │   (Activity List / Editor)       │  (AI Chat)        │
│      │                                  │                   │
│(icon │                                  │                   │
│strip │                                  │                   │
│when  │                                  │                   │
│close)│                                  │                   │
│      ├──────────────────────────────────┤                   │
│      │ AI Command Bar (bottom fixed)    │                   │
│      ├──────────────────────────────────┤                   │
│      │ LessonStrip (bottom, slideable)  │                   │
└──────┴──────────────────────────────────┴───────────────────┘
```

### 2. Panel Slide + Resize Animation

- **Left panel**: width 260px → 0px (animated 250ms ease-out)
  - Khi collapsed: icon strip 48px với icons cho từng section (Nội dung, Tương tác, Bố cục, Nhúng, Tài liệu)
  - Hover icon → tooltip tên section
  - Click icon → panel expand + scroll đến section đó
- **Right panel**: width 320px → 0px (animated 250ms ease-out)
  - Khi collapsed: icon strip 48px với icon AI chat + icon history
  - Click → expand
- **Canvas**: flex-1, tự co giãn mượt theo cả 2 panel
- CSS: sử dụng `transition: width 250ms ease-out` trên panel, KHÔNG animate width (dùng transform/max-width)

### 3. Numbered Components (Activity List)

Canvas hiển thị theo kiểu TalentLMS activity list:

```
┌────────────────────────────────────────┐
│  01  Khởi động: Tốc độ phản ứng       │
│ Free                                    │
│                                         │
│  ▶ Vì sao có phản ứng nhanh/chậm...   │
│  📝 Định nghĩa tốc độ phản ứng...      │
│  ❓ Tự kiểm tra nhanh kiến thức...      │
│  📋 Bộ công thức tối thiểu...           │
│  ✨ AI-generated activity will appear   │
│                                         │
│  [Add activity] [✨ Create with AI]     │
│                                         │
│  02  Đọc dữ liệu & đồ thị            │
│ Draft                                   │
│  ...                                    │
└────────────────────────────────────────┘
```

- Mỗi section = numbered (01, 02...) với title lớn + status badge
- Mỗi activity = 1 dòng: icon loại + title + metadata (duration, question count...)
- Click activity → full-page overlay editor
- Drag handle bên trái mỗi activity để reorder
- "Add activity" + "Create with AI" buttons ở cuối mỗi section

### 4. Activity Editor Overlay

Khi click 1 activity:
- Canvas chuyển thành full editor (transition slide-up hoặc fade)
- Header hiện breadcrumb: `Bài 1 > 3 · Văn bản`
- Nút "← Quay lại danh sách" ở góc trên
- Editor content: giữ nguyên BlockCard editor hiện tại (WYSIWYG)
- Escape key hoặc nút back → quay về activity list

### 5. AI Dual Mode

#### Command Bar (Bottom - Fixed)
```
┌────────────────────────────────────────────────────────────┐
│ [▼ Tạo trang về ▾] │ Nhập chủ đề hoặc yêu cầu... │ [+] [⚙] [→] │
└────────────────────────────────────────────────────────────┘
```

- Dropdown bên trái: 15 AI actions
- Input text ở giữa
- Nút "+": popup menu (Thêm tài liệu, Dán văn bản, Thêm SGK, Thêm URL)
- Nút "⚙": settings AI (model, tone, language)
- Nút "→": send

#### Chat Panel (Right)
- Conversational UI: messages list + input
- User messages + AI messages (streaming typewriter)
- Thinking indicator: 3 dots animation
- Suggested prompts khi empty state
- History: lịch sử các lệnh AI đã dùng

### 6. AI Streaming Simulation (Mock)

```typescript
// Typewriter effect
async function streamText(text: string, onChar: (char: string) => void, delay = 30) {
  for (const char of text) {
    onChar(char);
    await sleep(delay + Math.random() * 20); // 30-50ms variance
  }
}

// Thinking indicator: 1-2s random delay
// Block stagger: 500ms between blocks
// Progress: "Đang tạo 3/8 blocks..."
// Shimmer skeleton trên block đang generate
```

### 7. Left Palette — Grouped Sections

```
┌─────────────────────┐
│ 🔍 Tìm block...      │
├─────────────────────┤
│ ▼ Nội dung (5)       │
│ ┌─────┬─────┐       │
│ │📝   │🖼️   │       │
│ │Text │Image│       │
│ ├─────┼─────┤       │
│ │🎬   │💡   │       │
│ │Video│Call.│       │
│ ├─────┼─────┤       │
│ │➗    │     │       │
│ │Math │     │       │
│ └─────┴─────┘       │
│ ▼ Tương tác (4)      │
│ ┌─────┬─────┐       │
│ │❓   │🃏   │       │
│ │Quiz │Flash│       │
│ ├─────┼─────┤       │
│ │📦   │🔄   │       │
│ │Acc. │Proc.│       │
│ └─────┴─────┘       │
│ ▶ Bố cục (4)         │
│ ▶ Nhúng (3)          │
├─────────────────────┤
│ 📁 Tài liệu (12)    │
│  └ list materials    │
└─────────────────────┘
```

### 8. Design Tokens — Warm & Friendly

```css
/* Bổ sung vào course.css */
--builder-radius: 12px;
--builder-radius-sm: 8px;
--builder-radius-lg: 16px;
--builder-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--builder-shadow-hover: 0 4px 12px rgba(0,0,0,0.08);
--builder-transition: 250ms ease-out;

/* Panel animation */
--panel-width-left: 260px;
--panel-width-right: 320px;
--panel-collapsed: 48px;

/* Activity list */
--activity-bg: var(--card);
--activity-hover: var(--muted);
--activity-number-size: 48px;
--activity-badge-free: #10b981;
--activity-badge-draft: #f59e0b;
--activity-badge-published: #3b82f6;
```

### 9. 15 AI Actions

| # | Action | Icon | Tạo ra |
|---|--------|------|--------|
| 1 | Tạo trang về... | 🌐 | Full page nhiều blocks |
| 2 | Viết nội dung về... | ✏️ | Text block |
| 3 | Tạo hình ảnh về... | 🖼️ | Image block |
| 4 | Tạo video về... | 🎬 | Video block |
| 5 | Tạo audio về... | 🎧 | Audio block |
| 6 | Tạo mô hình 3D về... | 🧪 | 3D/VR embed |
| 7 | Tạo thẻ nhớ về... | 🃏 | Flashcards block |
| 8 | Tạo câu hỏi về... | ❓ | Quiz block |
| 9 | Tạo dàn ý về... | 📋 | Storyboard |
| 10 | Tạo quy trình về... | 🔄 | Process block |
| 11 | Tạo accordion về... | 📦 | Accordion block |
| 12 | Tạo callout về... | 💡 | Callout block |
| 13 | Tạo bố cục về... | 📐 | Columns block |
| 14 | Tạo code về... | 💻 | Code block |
| 15 | Tạo SCORM về... | 📊 | SCORM package |

### 10. Bottom LessonStrip Upgrade

- Slide up/down animation (250ms ease-out)
- Lesson cards: compact với mini thumbnail (gradient based on theme)
- Publish state: dot indicator (🟢 published, 🟡 dirty, ⚪ never)
- Active lesson: border accent + slight elevation
- Drag ghost: semi-transparent card with spring animation
- Collapse: smooth height transition to just header bar

---

## Constraints

- **AI chỉ mock** — không API/backend (giữ quyết định §2 handoff)
- **MobiFone Untitled UI tokens** — dùng `var(--token)`, không hex/Tailwind thô
- **Commit local** — không push, không merge main
- **Framer Motion** — đã có trong dự án, dùng cho animations
- **@dnd-kit** — giữ cho drag-drop

## Files cần thay đổi

| File | Thay đổi |
|------|---------|
| `course-builder.tsx` | Layout mới, panel animation, state management |
| `course-ai-panel.tsx` | Rewrite → AI Chat panel |
| `course-palette.tsx` | Grouped sections, collapsible, grid 2 cột |
| `page-canvas.tsx` | Rewrite → Activity list view |
| `block-card.tsx` | Thêm activity row mode |
| `lesson-strip.tsx` | Visual upgrade + animation |
| **NEW** `ai-command-bar.tsx` | Bottom command bar |
| **NEW** `ai-chat-panel.tsx` | Right panel chat UI |
| **NEW** `activity-editor.tsx` | Full-page overlay editor |
| **NEW** `streaming-utils.ts` | Typewriter, delay, stagger utilities |
| `src/styles/untitled/course.css` | New design tokens |
