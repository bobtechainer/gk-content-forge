// src/lib/curriculum.ts
export interface Outcome {
  id: string;
  code: string; // mã chuẩn, vd "TOAN10.DS.1"
  text: string;
}
export interface CurriculumLesson {
  id: string;
  title: string;
  outcomes: Outcome[];
}
export interface Chapter {
  id: string;
  title: string;
  lessons: CurriculumLesson[];
}
export interface Strand {
  id: string;
  title: string; // Mạch / Chủ đề
  chapters: Chapter[];
}
export interface CurriculumSubject {
  id: string;
  name: string;
  strands: Strand[];
}
export interface Grade {
  id: string;
  name: string;
  subjects: CurriculumSubject[];
}

export const CURRICULUM: Grade[] = [
  {
    id: "lop-10",
    name: "Lớp 10",
    subjects: [
      {
        id: "lop-10-toan",
        name: "Toán",
        strands: [
          {
            id: "lop-10-toan-daiso",
            title: "Đại số",
            chapters: [
              {
                id: "lop-10-toan-daiso-menhde",
                title: "Mệnh đề – Tập hợp",
                lessons: [
                  {
                    id: "bai-menhde",
                    title: "Mệnh đề",
                    outcomes: [
                      { id: "o1", code: "TOAN10.DS.1", text: "Phát biểu được mệnh đề toán học." },
                      { id: "o2", code: "TOAN10.DS.2", text: "Xác định được tính đúng/sai của mệnh đề." },
                    ],
                  },
                  {
                    id: "bai-taphop",
                    title: "Tập hợp và các phép toán",
                    outcomes: [
                      { id: "o3", code: "TOAN10.DS.3", text: "Thực hiện được các phép toán trên tập hợp." },
                    ],
                  },
                ],
              },
            ],
          },
          {
            id: "lop-10-toan-hinhhoc",
            title: "Hình học",
            chapters: [
              {
                id: "lop-10-toan-hinhhoc-vecto",
                title: "Vectơ",
                lessons: [
                  {
                    id: "bai-vecto",
                    title: "Khái niệm vectơ",
                    outcomes: [
                      { id: "o4", code: "TOAN10.HH.1", text: "Nhận biết được khái niệm vectơ, độ dài vectơ." },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "lop-10-van",
        name: "Ngữ văn",
        strands: [
          {
            id: "lop-10-van-doc",
            title: "Đọc",
            chapters: [
              {
                id: "lop-10-van-doc-thantho",
                title: "Thần thoại và sử thi",
                lessons: [
                  {
                    id: "bai-thantho",
                    title: "Đọc hiểu thần thoại",
                    outcomes: [
                      { id: "o5", code: "VAN10.D.1", text: "Phân tích được đặc trưng thể loại thần thoại." },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];

export const getGrade = (id: string): Grade | null =>
  CURRICULUM.find((g) => g.id === id) ?? null;

export const flattenLessons = (): CurriculumLesson[] =>
  CURRICULUM.flatMap((g) =>
    g.subjects.flatMap((s) =>
      s.strands.flatMap((st) => st.chapters.flatMap((c) => c.lessons)),
    ),
  );

export const findLesson = (id: string): CurriculumLesson | null =>
  flattenLessons().find((l) => l.id === id) ?? null;
