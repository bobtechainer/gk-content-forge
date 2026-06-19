import type { CourseBlock, CourseData } from "./course";
import {
  TIMELINE_SORT_WIDGET,
  H2O2_GRAPH_WIDGET,
  COLLISION_BOX_WIDGET,
  SURFACE_TEMP_WIDGET,
  ENERGY_MOUNTAIN_WIDGET,
} from "@/lib/widgets";

/* ─── Bài học demo: Bài 19 — Tốc độ phản ứng (Kết nối tri thức, Hoá 10) ───
 * Nội dung bám sát SGK, chia 5 chặng có cổng chặn. Người học trả lời đúng
 * hết trắc nghiệm trong chặng mới được sang chặng sau.
 * ────────────────────────────────────────────────────────────────── */

const sec = (id: string, title: string): CourseBlock => ({ id, type: "section", content: title, animation: "none" });
const html = (id: string, content: string): CourseBlock => ({ id, type: "html", layout: "full", animation: "fade-up", content });

const JOURNEY_BLOCKS: CourseBlock[] = [
  /* ─── Chặng 1: Khái niệm tốc độ phản ứng hoá học ───── */
  sec("c1", "Chặng 1 · Khái niệm tốc độ phản ứng hoá học"),
  {
    id: "c1a", type: "text", animation: "fade-up",
    content:
      "<p>Khi phản ứng hoá học xảy ra, lượng chất đầu giảm dần theo thời gian, trong khi lượng chất sản phẩm tăng dần. Sự thay đổi này diễn ra nhanh hay chậm tuỳ từng phản ứng.</p>" +
      "<p>Có phản ứng xảy ra rất nhanh như than cháy, pháo hoa nổ. Cũng có phản ứng rất chậm như sắt bị gỉ ngoài trời hay thạch nhũ hình thành trong hang động, phải mất hàng trăm đến hàng nghìn năm.</p>",
  },
  {
    id: "c1b", type: "callout", calloutVariant: "info", animation: "fade-up",
    content:
      "Tốc độ phản ứng được xác định bằng sự thay đổi lượng chất đầu hoặc chất sản phẩm trong một đơn vị thời gian. Đơn vị thời gian có thể là giây (s), phút (min), giờ (h) hay ngày (d). Lượng chất có thể biểu diễn bằng số mol, nồng độ mol, khối lượng hoặc thể tích.",
  },
  html("c1w", TIMELINE_SORT_WIDGET),
  {
    id: "c1c", type: "text", animation: "fade-up",
    content:
      "<p>Sau khi sắp xếp, em có thể thấy rõ: cùng là phản ứng hoá học nhưng thời gian diễn ra chênh nhau từ vài giây cho tới hàng thế kỉ. Trong thực tế, con người cần kiểm soát được tốc độ này, ví dụ làm cho phản ứng cháy nhanh hơn hoặc làm chậm sự ăn mòn kim loại.</p>",
  },
  {
    id: "c1q", type: "quiz", animation: "fade-up",
    content: "Trong các quá trình sau, quá trình nào diễn ra chậm nhất?",
    quizOptions: ["Than cháy trong lò", "Tiêu hoá thức ăn trong dạ dày", "Sắt bị gỉ ngoài trời", "Thạch nhũ hình thành trong hang động"],
    quizCorrect: 3,
    quizExplanation:
      "Thạch nhũ hình thành do phản ứng giữa nước chứa CO₂ hoà tan với đá vôi (CaCO₃). Quá trình này diễn ra cực kì chậm, phải mất hàng trăm đến hàng nghìn năm mới tạo ra được những nhũ đá lớn.",
  },

  /* ─── Chặng 2: Tốc độ trung bình của phản ứng ───── */
  sec("c2", "Chặng 2 · Tốc độ trung bình của phản ứng"),
  {
    id: "c2a", type: "text", animation: "fade-up",
    content:
      "<p>Xét phản ứng phân huỷ hydrogen peroxide: <strong>H₂O₂ → H₂O + ½O₂</strong>. Kết quả thí nghiệm đo nồng độ H₂O₂ tại các thời điểm khác nhau được trình bày trong Bảng 19.1:</p>" +
      "<table style='width:100%;border-collapse:collapse;margin-top:8px;font-size:14px'>" +
      "<thead><tr style='background:#eff6ff'><th style='border:1px solid #cbd5e1;padding:6px'>Thời gian (h)</th><th style='border:1px solid #cbd5e1;padding:6px'>0</th><th style='border:1px solid #cbd5e1;padding:6px'>3</th><th style='border:1px solid #cbd5e1;padding:6px'>6</th><th style='border:1px solid #cbd5e1;padding:6px'>9</th><th style='border:1px solid #cbd5e1;padding:6px'>12</th></tr></thead>" +
      "<tbody><tr><td style='border:1px solid #cbd5e1;padding:6px'>Nồng độ H₂O₂ (mol/L)</td><td style='border:1px solid #cbd5e1;padding:6px'>1,000</td><td style='border:1px solid #cbd5e1;padding:6px'>0,707</td><td style='border:1px solid #cbd5e1;padding:6px'>0,500</td><td style='border:1px solid #cbd5e1;padding:6px'>0,354</td><td style='border:1px solid #cbd5e1;padding:6px'>0,250</td></tr></tbody></table>",
  },
  {
    id: "c2b", type: "text", animation: "fade-up",
    content:
      "<p>Biến thiên nồng độ trong khoảng từ 0 đến 3 giờ là: 0,707 − 1,000 = −0,293 (mol/L). Dấu \"−\" cho thấy nồng độ H₂O₂ giảm dần khi phản ứng xảy ra.</p>" +
      "<p>Tốc độ phản ứng trong khoảng 0 đến 3 giờ được tính: v = −ΔC/Δt = −(0,707 − 1,000) / (3 − 0) ≈ 0,098 mol/(L·h). Ta đặt dấu \"−\" trước biểu thức để tốc độ phản ứng luôn có giá trị dương.</p>",
  },
  html("c2w", H2O2_GRAPH_WIDGET),
  {
    id: "c2m", type: "math", animation: "fade-up",
    content: "v_{tb} = -\\dfrac{\\Delta C}{\\Delta t}",
  },
  {
    id: "c2c", type: "text", animation: "fade-up",
    content:
      "<p>Đa số các phản ứng hoá học có tốc độ giảm dần theo thời gian. Để đặc trưng cho sự nhanh chậm của phản ứng trong một khoảng thời gian, ta dùng tốc độ trung bình. Càng về sau, đường cong nồng độ càng thoải, nghĩa là tốc độ trung bình càng nhỏ.</p>",
  },
  {
    id: "c2q1", type: "quiz", animation: "fade-up",
    content: "Tốc độ trung bình của phản ứng phân huỷ H₂O₂ trong khoảng 0 đến 3 giờ xấp xỉ bao nhiêu?",
    quizOptions: ["0,098 mol/(L·h)", "0,293 mol/(L·h)", "0,035 mol/(L·h)", "1,000 mol/(L·h)"],
    quizCorrect: 0,
    quizExplanation: "v = −ΔC/Δt = −(0,707 − 1,000) / 3 = 0,293 / 3 ≈ 0,098 mol/(L·h).",
  },
  {
    id: "c2q2", type: "quiz", animation: "fade-up",
    content: "Khi đi từ khoảng 0–3 h sang khoảng 9–12 h, nhận xét nào đúng về tốc độ phản ứng?",
    quizOptions: ["Tốc độ tăng dần", "Tốc độ giảm dần", "Tốc độ không đổi", "Không xác định được"],
    quizCorrect: 1,
    quizExplanation: "Nồng độ H₂O₂ giảm theo thời gian nên độ dốc của đường cong cũng giảm dần, kéo theo tốc độ trung bình giảm dần qua các khoảng thời gian.",
  },

  /* ─── Chặng 3: Ảnh hưởng của nồng độ và áp suất ───── */
  sec("c3", "Chặng 3 · Nồng độ, áp suất và thuyết va chạm"),
  {
    id: "c3a", type: "text", animation: "fade-up",
    content:
      "<p>Phản ứng hoá học xảy ra khi các hạt (phân tử, nguyên tử hoặc ion) va chạm với nhau. Tuy nhiên, không phải va chạm nào cũng tạo ra sản phẩm. Chỉ những va chạm có đủ năng lượng và đúng hướng mới dẫn tới phản ứng, gọi là <strong>va chạm hiệu quả</strong>.</p>" +
      "<p>Khi nồng độ chất phản ứng tăng lên, số va chạm giữa các hạt tăng theo, số va chạm hiệu quả cũng tăng, dẫn đến tốc độ phản ứng tăng.</p>",
  },
  html("c3w", COLLISION_BOX_WIDGET),
  {
    id: "c3b", type: "callout", calloutVariant: "tip", animation: "fade-up",
    content:
      "Trong hỗn hợp khí, nồng độ của mỗi khí tỉ lệ thuận với áp suất của nó. Khi nén hỗn hợp khí (giảm thể tích) thì nồng độ của mỗi khí tăng lên, do đó tốc độ phản ứng tăng. Lưu ý: thay đổi áp suất không ảnh hưởng đến tốc độ của phản ứng không có chất khí tham gia.",
  },
  {
    id: "c3q", type: "quiz", animation: "fade-up",
    content: "Áp suất ảnh hưởng đến tốc độ phản ứng nào sau đây?",
    quizOptions: [
      "N₂(g) + 3H₂(g) → 2NH₃(g)",
      "CO₂(g) + Ca(OH)₂(aq) → CaCO₃(s) + H₂O(l)",
      "SiO₂(s) + CaO(s) → CaSiO₃(s)",
      "BaCl₂(aq) + H₂SO₄(aq) → BaSO₄(s) + 2HCl(aq)",
    ],
    quizCorrect: 0,
    quizExplanation: "Phản ứng (1) có tất cả các chất đều ở thể khí, nên thay đổi áp suất sẽ làm thay đổi nồng độ của cả N₂ và H₂, từ đó ảnh hưởng đến tốc độ. Các phản ứng còn lại có chất rắn hoặc dung dịch nên áp suất không ảnh hưởng.",
  },

  /* ─── Chặng 4: Nhiệt độ và diện tích bề mặt ───── */
  sec("c4", "Chặng 4 · Nhiệt độ và diện tích bề mặt"),
  {
    id: "c4a", type: "text", animation: "fade-up",
    content:
      "<p>Khi tăng nhiệt độ, các hạt chuyển động nhanh hơn, động năng cao hơn. Số va chạm giữa các hạt tăng, số va chạm hiệu quả cũng tăng theo, dẫn đến tốc độ phản ứng tăng.</p>" +
      "<p>Thực nghiệm cho thấy: khi tăng nhiệt độ lên 10°C thì tốc độ phản ứng thường tăng từ 2 đến 4 lần. Hệ số γ (gọi là hệ số nhiệt độ Van't Hoff) được tính bằng tỉ số v(T+10) / v(T).</p>",
  },
  html("c4w", SURFACE_TEMP_WIDGET),
  {
    id: "c4m", type: "math", animation: "fade-up",
    content: "\\dfrac{v_{T+10}}{v_{T}} = \\gamma",
  },
  {
    id: "c4b", type: "text", animation: "fade-up",
    content:
      "<p>Về diện tích bề mặt: khi tăng diện tích bề mặt tiếp xúc, số va chạm giữa các chất đầu tăng lên, số va chạm hiệu quả cũng tăng, nên tốc độ phản ứng tăng. Ta có thể tăng diện tích bề mặt bằng cách giảm kích thước hạt rắn hoặc tạo nhiều đường rãnh, lỗ xốp trong lòng khối chất đó.</p>",
  },
  {
    id: "c4q1", type: "quiz", animation: "fade-up",
    content: "Cho cùng một lượng đá vôi (CaCO₃) phản ứng với dung dịch HCl 0,5 M. Dạng nào phản ứng nhanh hơn?",
    quizOptions: ["Dạng viên to", "Dạng đập nhỏ (bột)", "Hai dạng có tốc độ bằng nhau", "Cả hai đều không phản ứng"],
    quizCorrect: 1,
    quizExplanation: "Đá vôi dạng bột có tổng diện tích bề mặt lớn hơn nhiều so với dạng viên. HCl tiếp xúc được với nhiều bề mặt CaCO₃ hơn, nên phản ứng diễn ra nhanh hơn. Đây là nội dung thí nghiệm nghiên cứu ảnh hưởng của diện tích bề mặt trong SGK.",
  },
  {
    id: "c4q2", type: "quiz", animation: "fade-up",
    content: "Ở 20°C, tốc độ một phản ứng là 0,05 mol/(L·min). Ở 30°C, tốc độ là 0,15 mol/(L·min). Hệ số nhiệt độ Van't Hoff γ của phản ứng này bằng bao nhiêu?",
    quizOptions: ["γ = 2", "γ = 3", "γ = 4", "γ = 1,5"],
    quizCorrect: 1,
    quizExplanation: "γ = v(30°C) / v(20°C) = 0,15 / 0,05 = 3. Khi tăng 10°C, tốc độ phản ứng tăng 3 lần.",
  },

  /* ─── Chặng 5: Chất xúc tác ───── */
  sec("c5", "Chặng 5 · Chất xúc tác"),
  {
    id: "c5a", type: "text", animation: "fade-up",
    content:
      "<p>Ảnh hưởng của chất xúc tác đến tốc độ phản ứng được giải thích dựa vào <strong>năng lượng hoạt hoá</strong>. Đó là năng lượng tối thiểu cần cung cấp cho các hạt để khi va chạm có thể tạo thành liên kết mới, dẫn tới phản ứng hoá học.</p>" +
      "<p>Khi có xúc tác, phản ứng xảy ra qua nhiều giai đoạn, mỗi giai đoạn đều có năng lượng hoạt hoá thấp hơn so với phản ứng không có xúc tác. Do đó số hạt có đủ năng lượng hoạt hoá sẽ nhiều hơn, dẫn đến tốc độ phản ứng tăng lên.</p>",
  },
  html("c5w", ENERGY_MOUNTAIN_WIDGET),
  {
    id: "c5b", type: "callout", calloutVariant: "tip", animation: "fade-up",
    content:
      "Sau phản ứng, khối lượng và bản chất hoá học của chất xúc tác không thay đổi. Tuy nhiên, kích thước, hình dạng hạt, độ xốp có thể thay đổi. Chất xúc tác làm tăng tốc độ phản ứng nhưng không bị tiêu hao về lượng và chất sau phản ứng.",
  },
  {
    id: "c5q", type: "quiz", animation: "fade-up",
    content: "Chất xúc tác MnO₂ làm tăng tốc độ phản ứng phân huỷ H₂O₂ bằng cách nào?",
    quizOptions: [
      "Cung cấp thêm nhiệt cho phản ứng",
      "Tạo con đường phản ứng có năng lượng hoạt hoá thấp hơn",
      "Làm tăng nồng độ H₂O₂ trong dung dịch",
      "Phản ứng với H₂O₂ tạo sản phẩm khác",
    ],
    quizCorrect: 1,
    quizExplanation: "Chất xúc tác mở một con đường phản ứng mới với năng lượng hoạt hoá thấp hơn. Nhiều hạt H₂O₂ hơn có đủ năng lượng để vượt qua ngưỡng này, nên phản ứng diễn ra nhanh hơn nhiều so với khi không có xúc tác.",
  },
  {
    id: "c5end", type: "callout", calloutVariant: "info", animation: "fade-up",
    content:
      "Tóm lại, có năm yếu tố chính ảnh hưởng đến tốc độ phản ứng: nồng độ, áp suất (đối với chất khí), nhiệt độ, diện tích bề mặt và chất xúc tác. Tất cả đều liên quan đến số lượng va chạm hiệu quả giữa các hạt.",
  },
];

const APPLY_BLOCKS: CourseBlock[] = [
  {
    id: "a0", type: "text", animation: "fade-up",
    content:
      "<h3>Ứng dụng của việc thay đổi tốc độ phản ứng</h3><p>Trong đời sống và sản xuất, con người áp dụng nhiều biện pháp kĩ thuật để thay đổi tốc độ phản ứng: thay đổi nồng độ, nhiệt độ, dùng chất xúc tác, thay đổi áp suất hay diện tích bề mặt.</p>",
  },
  {
    id: "a1", type: "callout", calloutVariant: "tip", animation: "fade-up",
    content: "Trong hàn xì, đốt acetylene bằng oxygen nguyên chất thay cho không khí giúp tăng nồng độ oxygen, nhờ đó ngọn lửa cháy nhanh và đạt nhiệt độ cao hơn khi đốt bằng oxygen trong không khí.",
  },
  {
    id: "a2", type: "callout", calloutVariant: "info", animation: "fade-up",
    content: "Tủ lạnh bảo quản thức ăn lâu hơn vì nhiệt độ thấp làm chậm các phản ứng phân huỷ chất hữu cơ và hạn chế hoạt động của vi sinh vật gây hỏng thức ăn.",
  },
  {
    id: "a3", type: "callout", calloutVariant: "warning", animation: "fade-up",
    content: "Bình dưa muối là ứng dụng của việc điều chỉnh tốc độ phản ứng lên men. Nồng độ muối và nhiệt độ là hai yếu tố chính được kiểm soát để quá trình muối dưa diễn ra vừa phải.",
  },
  {
    id: "a4", type: "quiz", animation: "fade-up",
    content: "Tại sao thức ăn để trong tủ lạnh lại lâu hỏng hơn so với để ngoài?",
    quizOptions: [
      "Vì nhiệt độ thấp làm chậm các phản ứng phân huỷ",
      "Vì tủ lạnh tiêu diệt toàn bộ vi khuẩn",
      "Vì trong tủ lạnh không có oxygen",
      "Vì áp suất trong tủ lạnh rất cao",
    ],
    quizCorrect: 0,
    quizExplanation: "Nhiệt độ thấp làm giảm tốc độ các phản ứng phân huỷ chất hữu cơ trong thức ăn, đồng thời làm chậm sự sinh sản của vi sinh vật. Tủ lạnh không diệt sạch vi khuẩn, chỉ làm chậm hoạt động của chúng.",
  },
  {
    id: "a5", type: "quiz", animation: "fade-up",
    content: "Vì sao nhiều phản ứng hoá học trong công nghiệp cần tiến hành ở nhiệt độ cao và sử dụng chất xúc tác?",
    quizOptions: [
      "Để giảm chi phí nguyên liệu",
      "Để tăng tốc độ phản ứng, rút ngắn thời gian sản xuất",
      "Để phản ứng tạo ra sản phẩm khác",
      "Để giảm lượng chất thải",
    ],
    quizCorrect: 1,
    quizExplanation: "Nhiệt độ cao giúp các hạt va chạm mạnh hơn, nhiều hơn; chất xúc tác giúp hạ năng lượng hoạt hoá. Cả hai biện pháp đều nhằm tăng tốc độ phản ứng để việc sản xuất diễn ra nhanh hơn, hiệu quả hơn.",
  },
];

export const SAMPLE_COURSE: CourseData = {
  chapters: [
    { id: "ch1", title: "Chương 1: Bài 19 — Tốc độ phản ứng", courseId: "demo" },
    { id: "ch2", title: "Chương 2: Ứng dụng & Ghi nhớ", courseId: "demo" },
  ],
  lessons: [
    {
      id: "ls1",
      title: "Khám phá tốc độ phản ứng hoá học",
      chapterId: "ch1",
      blocks: JOURNEY_BLOCKS,
    },
    {
      id: "ls2",
      title: "Ứng dụng thay đổi tốc độ phản ứng",
      chapterId: "ch2",
      blocks: APPLY_BLOCKS,
    },
  ],
};
