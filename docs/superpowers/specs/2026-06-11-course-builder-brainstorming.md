# Course Builder — Brainstorming Notes

> Ngày: 2026-06-11
> Nguồn cảm hứng: Brilliant.org (nghiên cứu qua NotebookLM)

## Quyết định thiết kế

### 1. Mô hình nội dung: **Kết hợp (Assembly + Page Builder)**
- Giáo viên tạo cấu trúc Chương → Bài
- Mỗi bài có thể **soạn nội dung trực tiếp** bằng blocks VÀ **embed học liệu có sẵn** từ kho

### 2. Block types (8 loại)
| # | Block type | Mô tả |
|---|---|---|
| 1 | Rich Text | TipTap editor: tiêu đề, đoạn văn, danh sách, bold/italic |
| 2 | Hình ảnh | Upload/kéo thả ảnh minh họa |
| 3 | Video | Upload hoặc embed YouTube/link |
| 4 | Callout/Tip | Ô nổi bật: ghi chú, mẹo, cảnh báo (Notion callout) |
| 5 | Divider | Đường kẻ phân cách |
| 6 | Embed học liệu | Kéo thả quiz/tài liệu/video từ kho có sẵn |
| 7 | Code block | Syntax highlight |
| 8 | Công thức toán | LaTeX/KaTeX |

### 3. Layout: Full Page Builder (Hướng C)
```
┌─────────────────────────────────────────────────────────┐
│ Header: ← Back | [Title input] | Preview | Settings | Publish │
├────────┬──────────────────────────────────┬─────────────┤
│ Left   │        Center (Canvas)           │   Right     │
│ Palette│  Scrollable Page View            │   AI Panel  │
│ -------│  ┌──────────────────────┐        │   (chat)    │
│ Tab    │  │ Block 1 (text)       │        │             │
│ Blocks │  │ ─── drag handle ──── │        │  collapsible│
│ (8 loại)│ │ Block 2 (image)      │        │             │
│ -------│  │ ─── hover indicator ─│        │             │
│ Tab    │  │ Block 3 (embed quiz) │        │             │
│ Học liệu│ │ ─── slash cmd (/) ── │        │             │
│        │  │ Block 4 (callout)    │        │             │
│collapse│  └──────────────────────┘        │             │
├────────┴──────────────────────────────────┴─────────────┤
│ Bottom Strip: [Ch.1 ─ Bài 1 | Bài 2] ── [Ch.2 ─ Bài 3 | +] ── [+ Chương] │
└─────────────────────────────────────────────────────────┘
```

### 4. Chi tiết UI
- **Left Palette**: 2 tabs (Blocks, Học liệu) — icon rail + expandable panel — collapsible
- **Canvas**: Page view — tất cả blocks xếp dọc, scroll, slash commands (`/`), drag-drop reorder với hover indicator giữa blocks
- **Right AI Panel**: Chat AI tạo nội dung bài học — collapsible
- **Bottom Strip**: Flat list tất cả bài trong khóa học, phân nhóm bằng chapter separator/badge — collapsible
- **Structure Drawer**: Overlay/drawer trượt từ trái, đè lên palette + một phần canvas. Toggle từ header icon "📑 Cấu trúc"

### 5. Tính năng Full Page Builder
- Slash commands (`/`) — gõ `/` hiện menu block types
- Kéo thả giữa blocks với hover indicator
- Inline editing cho mỗi block type
- Tất cả panels đóng/mở để tối ưu không gian

## Cấu trúc dữ liệu
```
Course
  └── Chapter (chương)
        └── Lesson (bài học)
              └── Block (khối nội dung)
                    - type: text | image | video | callout | divider | embed | code | math
                    - content: string (HTML for text, URL for media, etc.)
```

### 6. Layout Modes (v3)

Mỗi block có thể chọn layout qua **Visual Dropdown** (click icon LayoutGrid trên toolbar):

| Layout | Max width | Use case |
|---|---|---|
| **Centered** | ~672px (max-w-2xl) | Text giải thích, lý thuyết (mặc định) |
| **Full** | 100% container | Interactive, animation lớn, hình toàn cảnh |

> **Note:** Split layout đã thay bằng **Columns block** (block type riêng).

### 7. Columns Block (block type thứ 9)

Block type "Nhiều cột" — cho phép chia nội dung thành **2, 3, hoặc 4 cột**:
- Chọn số cột bằng visual selector (preview hình cột)
- Mỗi cột là container riêng, thêm block con vào
- Block con hiện tại hỗ trợ text (sẽ mở rộng thêm image, callout...)
- Preview mode render đúng CSS Grid

### 8. Inline Preview Mode

Toggle `[✏️ Soạn] / [👁 Preview]` trên header:
- **Edit mode**: Full editor, tất cả panels hiện, drag-drop, slash commands
- **Preview mode**: Ẩn tất cả panels (left palette, right AI, bottom strip), canvas full-screen, blocks render read-only, scroll animations chạy real-time, layout modes áp dụng đúng
- Bấm `Esc` hoặc toggle lại quay về edit

### 9. Animation Styles (Scroll Reveal)

Mỗi block có animation khi cuộn đến:

| Animation | Mô tả |
|---|---|
| **Fade Up** | Mờ → rõ + trượt lên (default) |
| **Parallax** | Mờ + scale nhẹ → full |
| **Progressive** | Trượt từ trái vào |
| **None** | Không hiệu ứng |

### 10. UI Controls Positioning (v3)

- **Toggle đóng/mở**: Gắn vào cạnh panel (tab nhỏ), không ở header
- **Nút "Cấu trúc"**: Nằm ở thanh lesson strip (bottom), không ở header
- **Bottom strip**: Tự chứa collapse handle (arrow lên/xuống)
- **Header**: Back, title, [Soạn/Preview toggle], Publish — tối giản
- **Layout selector**: Visual Dropdown gắn vào block toolbar

### 11. Inline Rename

- **Lesson strip**: Double-click để đổi tên chương/bài nhanh
- **Structure drawer**: Click icon Pencil để đổi tên

## Research từ Brilliant.org (NotebookLM)
- Learning Paths → Courses → Lessons → Interactive Problems
- Mỗi bài chỉ tập trung 1 khái niệm duy nhất
- Visual-first: hình ảnh, interactive, ít text dài
- Gamification: streaks, XP, leagues, celebrations
- "Game Feel" North Star — UX + game design principles
- Rive animations cho color-coded pathways, streaks
- Koji AI tutor: hỏi thay vì đưa đáp án, theo dõi tiến độ
