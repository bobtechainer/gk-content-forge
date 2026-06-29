/**
 * Khung chung — kho chủ đề / chuyên đề của mọi môn (mock).
 *
 * Đây là điểm định danh dùng chung: sau này mọi học liệu / storyboard / khoá học
 * sẽ gắn vào một chủ đề trong khung này. Hiện mock đủ để chọn làm tham chiếu.
 */

export interface RegistryTopic {
  id: string;
  name: string;
}
export interface RegistryStrand {
  id: string;
  name: string;
  topics: RegistryTopic[];
}
export interface RegistrySubject {
  id: string;
  name: string;
  grade: string;
  strands: RegistryStrand[];
}

const t = (id: string, name: string): RegistryTopic => ({ id, name });

export const TOPIC_REGISTRY: RegistrySubject[] = [
  {
    id: "hoa-10", name: "Hoá học", grade: "Lớp 10",
    strands: [
      { id: "hoa-10-pu", name: "Phản ứng hoá học", topics: [t("hoa-toc-do", "Tốc độ phản ứng"), t("hoa-can-bang", "Cân bằng hoá học"), t("hoa-oxh", "Phản ứng oxi hoá – khử")] },
      { id: "hoa-10-bang", name: "Bảng tuần hoàn", topics: [t("hoa-cau-tao", "Cấu tạo nguyên tử"), t("hoa-xu-huong", "Xu hướng tuần hoàn")] },
    ],
  },
  {
    id: "ly-11", name: "Vật lí", grade: "Lớp 11",
    strands: [
      { id: "ly-11-dien", name: "Điện học", topics: [t("ly-dien-truong", "Điện trường"), t("ly-dong-dien", "Dòng điện không đổi")] },
      { id: "ly-11-dao-dong", name: "Dao động & sóng", topics: [t("ly-dao-dong", "Dao động điều hoà"), t("ly-song-co", "Sóng cơ")] },
    ],
  },
  {
    id: "toan-12", name: "Toán", grade: "Lớp 12",
    strands: [
      { id: "toan-12-gt", name: "Giải tích", topics: [t("toan-dao-ham", "Đạo hàm & ứng dụng"), t("toan-tich-phan", "Nguyên hàm – tích phân")] },
      { id: "toan-12-hh", name: "Hình học", topics: [t("toan-toa-do", "Toạ độ trong không gian"), t("toan-mat-cau", "Mặt cầu")] },
    ],
  },
  {
    id: "van-10", name: "Ngữ văn", grade: "Lớp 10",
    strands: [
      { id: "van-10-doc", name: "Đọc hiểu", topics: [t("van-truyen", "Truyện ngắn hiện đại"), t("van-tho", "Thơ Đường luật")] },
      { id: "van-10-viet", name: "Viết", topics: [t("van-nghi-luan", "Nghị luận xã hội")] },
    ],
  },
  {
    id: "sinh-11", name: "Sinh học", grade: "Lớp 11",
    strands: [
      { id: "sinh-11-tv", name: "Sinh học thực vật", topics: [t("sinh-quang-hop", "Quang hợp"), t("sinh-thoat-hoi", "Thoát hơi nước")] },
      { id: "sinh-11-dv", name: "Sinh học động vật", topics: [t("sinh-tuan-hoan", "Tuần hoàn máu"), t("sinh-than-kinh", "Cảm ứng ở động vật")] },
    ],
  },
];

export interface FlatTopic {
  id: string;
  name: string;
  subject: string;
  strand: string;
  grade: string;
  /** Nhãn đầy đủ để hiển thị/tìm kiếm: "Hoá học · Phản ứng hoá học · Tốc độ phản ứng". */
  path: string;
}

/** Phẳng hoá toàn bộ chủ đề để chọn / tìm kiếm. */
export function allTopics(): FlatTopic[] {
  const out: FlatTopic[] = [];
  for (const s of TOPIC_REGISTRY) {
    for (const st of s.strands) {
      for (const tp of st.topics) {
        out.push({ id: tp.id, name: tp.name, subject: s.name, strand: st.name, grade: s.grade, path: `${s.name} · ${st.name} · ${tp.name}` });
      }
    }
  }
  return out;
}
