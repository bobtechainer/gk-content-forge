import type { CourseBlock, CourseData } from "./course";
import {
  TIMELINE_SORT_WIDGET,
  H2O2_GRAPH_WIDGET,
  COLLISION_BOX_WIDGET,
  SURFACE_TEMP_WIDGET,
  ENERGY_MOUNTAIN_WIDGET,
} from "@/lib/widgets";

/* ─── Bài học demo: Bài 19 — Tốc độ phản ứng (Kết nối tri thức) ─────
 * Một hành trình 5 chặng, chia phần có cổng chặn (mỗi chặng mở đầu bằng block
 * "section"). Người học phải trả lời đúng hết trắc nghiệm trong chặng mới được
 * sang chặng sau. Mỗi chặng có một widget HTML tương tác.
 *
 * Các id dưới đây chỉ là placeholder — cloneSampleCourse() trong course.ts sẽ
 * sinh id mới, duy nhất cho từng course. 100% tiếng Việt.
 * ────────────────────────────────────────────────────────────────── */

const sec = (id: string, title: string): CourseBlock => ({ id, type: "section", content: title, animation: "none" });
const html = (id: string, content: string): CourseBlock => ({ id, type: "html", layout: "full", animation: "fade-up", content });

const JOURNEY_BLOCKS: CourseBlock[] = [
  /* ─── Chặng 1 ─────────────────────────────────────────── */
  sec("c1", "Chặng 1 · Cảm nhận thời gian"),
  {
    id: "c1a", type: "text", animation: "fade-up",
    content:
      "<p>Phản ứng hoá học nào cũng cần thời gian, nhưng thời gian đó chênh nhau rất nhiều. Có phản ứng xong trong chớp mắt, có phản ứng kéo dài cả nghìn năm. Trước khi đụng tới công thức, ta hãy cảm nhận sự nhanh – chậm này đã.</p>",
  },
  {
    id: "c1b", type: "callout", calloutVariant: "info", animation: "fade-up",
    content:
      "Cùng là biến đổi chất, nhưng đốt pháo hoa chỉ mất vài giây, còn thạch nhũ trong hang động phải mất hàng nghìn năm mới hình thành.",
  },
  html("c1w", TIMELINE_SORT_WIDGET),
  {
    id: "c1c", type: "text", animation: "fade-up",
    content:
      "<p>Sau khi xếp xong, em thử hình dung: nếu mọi phản ứng đều diễn ra cùng một tốc độ thì bữa trưa sẽ tiêu hoá xong trong tích tắc, hoặc kéo dài cả tháng. Tốc độ khác nhau chính là thứ ta cần điều khiển.</p>",
  },
  {
    id: "c1q", type: "quiz", animation: "fade-up",
    content: "Trong các quá trình sau, quá trình nào có tốc độ phản ứng chậm nhất?",
    quizOptions: ["Đốt pháo hoa", "Tiêu hoá thức ăn", "Sắt để ngoài trời bị gỉ", "Thạch nhũ hình thành trong hang động"],
    quizCorrect: 3,
    quizExplanation:
      "Thạch nhũ hình thành rất chậm, mất hàng trăm đến hàng nghìn năm, nên đây là quá trình có tốc độ chậm nhất trong nhóm.",
  },

  /* ─── Chặng 2 ─────────────────────────────────────────── */
  sec("c2", "Chặng 2 · Giải mã đồ thị H₂O₂"),
  {
    id: "c2a", type: "text", animation: "fade-up",
    content:
      "<p>Xét phản ứng phân huỷ hydrogen peroxide: <strong>H₂O₂ → H₂O + ½O₂</strong>. Người ta đo nồng độ H₂O₂ còn lại ở các thời điểm khác nhau (Bảng 19.1):</p>" +
      "<table style='width:100%;border-collapse:collapse;margin-top:8px;font-size:14px'>" +
      "<thead><tr style='background:#eff6ff'><th style='border:1px solid #cbd5e1;padding:6px'>Thời gian (h)</th><th style='border:1px solid #cbd5e1;padding:6px'>0</th><th style='border:1px solid #cbd5e1;padding:6px'>3</th><th style='border:1px solid #cbd5e1;padding:6px'>6</th><th style='border:1px solid #cbd5e1;padding:6px'>9</th><th style='border:1px solid #cbd5e1;padding:6px'>12</th></tr></thead>" +
      "<tbody><tr><td style='border:1px solid #cbd5e1;padding:6px'>Nồng độ (mol/L)</td><td style='border:1px solid #cbd5e1;padding:6px'>1,000</td><td style='border:1px solid #cbd5e1;padding:6px'>0,707</td><td style='border:1px solid #cbd5e1;padding:6px'>0,500</td><td style='border:1px solid #cbd5e1;padding:6px'>0,354</td><td style='border:1px solid #cbd5e1;padding:6px'>0,250</td></tr></tbody></table>",
  },
  {
    id: "c2b", type: "text", animation: "fade-up",
    content:
      "<p>Thay vì học thuộc bảng số, hãy kéo cửa sổ thời gian dọc theo đường cong. Để ý độ dốc của tam giác và con số tốc độ thay đổi ra sao.</p>",
  },
  html("c2w", H2O2_GRAPH_WIDGET),
  {
    id: "c2m", type: "math", animation: "fade-up",
    content: "v_{tb} = -\\dfrac{\\Delta C}{\\Delta t}",
  },
  {
    id: "c2c", type: "text", animation: "fade-up",
    content:
      "<p>Dấu trừ đặt trước để tốc độ luôn dương, vì nồng độ chất đầu giảm dần nên ΔC mang dấu âm. Càng về sau, đường cong càng thoải, tốc độ trung bình càng nhỏ.</p>",
  },
  {
    id: "c2q1", type: "quiz", animation: "fade-up",
    content: "Khi đi từ khoảng 0–3 h sang khoảng 9–12 h, tốc độ trung bình của phản ứng thay đổi thế nào?",
    quizOptions: ["Tăng dần", "Giảm dần", "Không đổi", "Lúc tăng lúc giảm"],
    quizCorrect: 1,
    quizExplanation: "Độ dốc của đường cong giảm dần theo thời gian, nên tốc độ trung bình cũng giảm dần.",
  },
  {
    id: "c2q2", type: "quiz", animation: "fade-up",
    content: "Tốc độ trung bình của phản ứng trong khoảng 0–3 giờ xấp xỉ bao nhiêu?",
    quizOptions: ["0,098 mol/(L·h)", "0,293 mol/(L·h)", "0,035 mol/(L·h)", "1,000 mol/(L·h)"],
    quizCorrect: 0,
    quizExplanation: "v = -ΔC/Δt = -(0,707 - 1,000)/3 = 0,293/3 ≈ 0,098 mol/(L·h).",
  },

  /* ─── Chặng 3 ─────────────────────────────────────────── */
  sec("c3", "Chặng 3 · Thuyết va chạm"),
  {
    id: "c3a", type: "text", animation: "fade-up",
    content:
      "<p>Vì sao tăng nồng độ hay tăng áp suất lại làm phản ứng nhanh hơn? Hãy nhìn ở mức vi mô: phản ứng xảy ra khi các hạt va chạm đủ mạnh vào nhau. Nồng độ và áp suất thực chất đều là chuyện <strong>mật độ hạt</strong>.</p>",
  },
  html("c3w", COLLISION_BOX_WIDGET),
  {
    id: "c3b", type: "callout", calloutVariant: "tip", animation: "fade-up",
    content:
      "Với chất khí, nén để giảm thể tích bình (tăng áp suất) cũng giống như tăng nồng độ: số hạt trong một đơn vị thể tích tăng lên, va chạm dày hơn.",
  },
  {
    id: "c3q", type: "quiz", animation: "fade-up",
    content: "Khi nén hỗn hợp khí để giảm thể tích bình chứa, vì sao tốc độ phản ứng tăng?",
    quizOptions: [
      "Vì các hạt chuyển động chậm lại",
      "Vì mật độ hạt tăng nên số va chạm hiệu quả tăng",
      "Vì nhiệt độ của hệ giảm",
      "Vì khối lượng các chất tăng lên",
    ],
    quizCorrect: 1,
    quizExplanation: "Giảm thể tích làm số hạt trong một đơn vị thể tích tăng, nên số va chạm hiệu quả tăng theo, kéo tốc độ lên.",
  },

  /* ─── Chặng 4 ─────────────────────────────────────────── */
  sec("c4", "Chặng 4 · Diện tích bề mặt và nhiệt độ"),
  {
    id: "c4a", type: "text", animation: "fade-up",
    content:
      "<p>Có hai cách tăng tốc rất quen thuộc trong phòng thí nghiệm và đời sống: chia nhỏ chất rắn để tăng diện tích bề mặt tiếp xúc, và tăng nhiệt độ. Em thử lần lượt hai tab dưới đây.</p>",
  },
  html("c4w", SURFACE_TEMP_WIDGET),
  {
    id: "c4m", type: "math", animation: "fade-up",
    content: "\\dfrac{v_{T+10}}{v_{T}} = \\gamma",
  },
  {
    id: "c4b", type: "text", animation: "fade-up",
    content:
      "<p>Hệ số nhiệt độ γ (Van't Hoff) thường nằm trong khoảng 2 đến 4. Mỗi lần tăng 10 °C, tốc độ không cộng thêm mà nhân lên γ lần, nên tăng vài chục độ là tốc độ đã thay đổi rất mạnh.</p>",
  },
  {
    id: "c4q1", type: "quiz", animation: "fade-up",
    content: "Cùng một khối lượng đá vôi, dạng nào phản ứng với dung dịch HCl nhanh hơn?",
    quizOptions: ["Dạng viên to", "Dạng bột mịn", "Hai dạng như nhau", "Cả hai đều không phản ứng"],
    quizCorrect: 1,
    quizExplanation: "Bột mịn có tổng diện tích bề mặt lớn hơn nhiều, HCl tiếp xúc được nhiều chỗ hơn nên phản ứng nhanh hơn.",
  },
  {
    id: "c4q2", type: "quiz", animation: "fade-up",
    content: "Một phản ứng có hệ số nhiệt độ γ = 2. Khi tăng nhiệt độ thêm 30 °C, tốc độ tăng khoảng bao nhiêu lần?",
    quizOptions: ["×3", "×6", "×8", "×2"],
    quizCorrect: 2,
    quizExplanation: "Tăng 30 °C là ba lần tăng 10 °C, nên tốc độ nhân với γ ba lần: 2 × 2 × 2 = 8 lần.",
  },

  /* ─── Chặng 5 ─────────────────────────────────────────── */
  sec("c5", "Chặng 5 · Năng lượng hoạt hoá và xúc tác"),
  {
    id: "c5a", type: "text", animation: "fade-up",
    content:
      "<p>Muốn phản ứng xảy ra, các hạt không chỉ cần va chạm mà còn phải vượt qua một ngưỡng năng lượng gọi là <strong>năng lượng hoạt hoá Eₐ</strong>. Hãy thử đẩy hòn đá vượt núi, rồi thêm chất xúc tác để thấy điều thú vị.</p>",
  },
  html("c5w", ENERGY_MOUNTAIN_WIDGET),
  {
    id: "c5b", type: "callout", calloutVariant: "tip", animation: "fade-up",
    content:
      "Chất xúc tác làm tăng tốc độ phản ứng bằng cách mở một con đường có năng lượng hoạt hoá thấp hơn. Sau phản ứng, nó không bị tiêu hao, khối lượng và bản chất hoá học không đổi.",
  },
  {
    id: "c5q", type: "quiz", animation: "fade-up",
    content: "Vai trò của chất xúc tác (ví dụ MnO₂ trong phân huỷ H₂O₂) là gì?",
    quizOptions: [
      "Cung cấp thêm năng lượng cho phản ứng",
      "Tạo con đường phản ứng có năng lượng hoạt hoá thấp hơn",
      "Làm tăng nồng độ chất phản ứng",
      "Bị tiêu hao hết sau phản ứng",
    ],
    quizCorrect: 1,
    quizExplanation: "Xúc tác không tự cấp năng lượng và không bị tiêu hao; nó mở một con đường mới có Eₐ thấp hơn nên phản ứng dễ xảy ra hơn.",
  },
  {
    id: "c5end", type: "callout", calloutVariant: "info", animation: "fade-up",
    content:
      "Năm yếu tố ảnh hưởng đến tốc độ phản ứng: nồng độ, áp suất (với chất khí), nhiệt độ, diện tích bề mặt và chất xúc tác. Em đã trải nghiệm cả năm qua hành trình này.",
  },
];

const APPLY_BLOCKS: CourseBlock[] = [
  {
    id: "a0", type: "text", animation: "fade-up",
    content:
      "<h3>Tốc độ phản ứng quanh ta</h3><p>Con người vận dụng các yếu tố ảnh hưởng đến tốc độ phản ứng ở khắp nơi trong đời sống và sản xuất. Cùng điểm qua vài ví dụ quen thuộc.</p>",
  },
  {
    id: "a1", type: "callout", calloutVariant: "tip", animation: "fade-up",
    content: "Đèn xì oxygen – acetylene dùng oxygen nguyên chất thay cho không khí để tăng nồng độ oxygen, nhờ đó ngọn lửa cháy nhanh và nóng hơn.",
  },
  {
    id: "a2", type: "callout", calloutVariant: "info", animation: "fade-up",
    content: "Tủ lạnh giữ thức ăn lâu hỏng vì nhiệt độ thấp làm chậm các phản ứng phân huỷ và hoạt động của vi sinh vật.",
  },
  {
    id: "a3", type: "callout", calloutVariant: "warning", animation: "fade-up",
    content: "Muối dưa, muối cà là quá trình lên men. Người ta điều chỉnh nhiệt độ và lượng muối để kiểm soát tốc độ lên men cho vừa ý.",
  },
  {
    id: "a4", type: "quiz", animation: "fade-up",
    content: "Vì sao để thức ăn trong tủ lạnh lại lâu hỏng hơn?",
    quizOptions: [
      "Vì nhiệt độ thấp làm chậm các phản ứng phân huỷ",
      "Vì tủ lạnh diệt sạch mọi vi khuẩn",
      "Vì trong tủ lạnh hoàn toàn không có oxygen",
      "Vì áp suất trong tủ lạnh rất cao",
    ],
    quizCorrect: 0,
    quizExplanation: "Hạ nhiệt độ làm tốc độ các phản ứng phân huỷ giảm mạnh, nên thức ăn lâu hỏng hơn chứ không phải tủ lạnh diệt hết vi khuẩn.",
  },
  {
    id: "a5", type: "quiz", animation: "fade-up",
    content: "Trong đèn xì, người ta dùng oxygen nguyên chất thay cho không khí nhằm mục đích gì?",
    quizOptions: [
      "Giảm nhiệt độ ngọn lửa",
      "Tăng nồng độ oxygen nên phản ứng cháy nhanh và nóng hơn",
      "Làm phản ứng cháy chậm lại cho an toàn",
      "Tiết kiệm nhiên liệu acetylene",
    ],
    quizCorrect: 1,
    quizExplanation: "Oxygen nguyên chất có nồng độ cao hơn nhiều so với trong không khí, nên phản ứng cháy diễn ra nhanh hơn và toả nhiệt mạnh hơn.",
  },
];

export const SAMPLE_COURSE: CourseData = {
  chapters: [
    { id: "ch1", title: "Chương 1: Bài 19 — Tốc độ phản ứng", courseId: "demo" },
    { id: "ch2", title: "Chương 2: Vận dụng & Ghi nhớ", courseId: "demo" },
  ],
  lessons: [
    {
      id: "ls1",
      title: "Hành trình: Khám phá tốc độ phản ứng",
      chapterId: "ch1",
      blocks: JOURNEY_BLOCKS,
    },
    {
      id: "ls2",
      title: "Tốc độ phản ứng quanh ta",
      chapterId: "ch2",
      blocks: APPLY_BLOCKS,
    },
  ],
};
