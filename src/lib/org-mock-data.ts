import type { Login, OrgNode, Membership } from "./org/types";
import type { OrgRoleId } from "./org/capabilities";

export const ORG_NODES: OrgNode[] = [
  // Cây NXB Giáo dục VN
  { id: "nxbgd", name: "NXB Giáo dục VN", shortName: "GD", type: "business", parentId: null, avatarColor: "#20447E", businessLicense: "GP-XB-0123/NXBGD", bio: "Nhà xuất bản Giáo dục Việt Nam — đơn vị xuất bản học liệu chính thống, sách giáo khoa và tài liệu tham khảo trên toàn quốc.", followers: 25340, website: "https://nxbgd.vn", email: "lienhe@nxbgd.vn" },
  { id: "nxbgd-toan", name: "Chi nhánh Toán", shortName: "T", type: "business", parentId: "nxbgd", avatarColor: "#237BD3", bio: "Chi nhánh chuyên môn Toán — biên soạn SGK, sách bài tập và đề kiểm tra môn Toán theo chương trình GDPT 2018.", followers: 8120, website: "https://nxbgd.vn/toan", email: "toan@nxbgd.vn" },
  { id: "nxbgd-van", name: "Chi nhánh Ngữ văn", shortName: "V", type: "business", parentId: "nxbgd", avatarColor: "#0EA5A4", bio: "Chi nhánh Ngữ văn — học liệu đọc hiểu, làm văn và tác phẩm văn học theo chương trình mới.", followers: 6540, website: "https://nxbgd.vn/nguvan", email: "nguvan@nxbgd.vn" },
  // Đối tác EdTech
  { id: "vietedu", name: "Công ty Công nghệ Giáo dục VietEdu", shortName: "VE", type: "business", parentId: null, avatarColor: "#7C3AED", businessLicense: "GP-DN-7788/VE", bio: "Công ty công nghệ giáo dục — phát triển học liệu tương tác, lớp học thích ứng và mô phỏng 3D/VR cho trường học số.", followers: 18750, website: "https://vietedu.vn", email: "hello@vietedu.vn" },
  // Không gian cá nhân (mỗi cá nhân 1 node personal gốc)
  { id: "pn-hong", name: "Nguyễn Minh Hồng", shortName: "MH", type: "personal", parentId: null, avatarColor: "#F59E0B", bio: "Giáo viên Tiếng Anh, cộng tác viên biên soạn học liệu cho nhiều đơn vị.", followers: 1840, website: "https://minhhong.edu.vn", email: "minhhong@email.vn" },
  { id: "pn-hieu", name: "Lê Trung Hiếu", shortName: "LH", type: "personal", parentId: null, avatarColor: "#F59E0B", bio: "Giáo viên Hóa học — THCS Lý Thường Kiệt. Chia sẻ bài giảng và học liệu thí nghiệm Hóa.", followers: 124, website: "https://thayhieu.vn", email: "letrunghieu@thcs-ltk.edu.vn" },
  { id: "pn-nhi", name: "Hoàng Xuân Nhi", shortName: "HN", type: "personal", parentId: null, avatarColor: "#2563EB", bio: "Giáo viên Toán — THPT Chuyên Lê Hồng Phong. Chuyên bồi dưỡng học sinh giỏi.", followers: 8420, website: "https://conhi.edu.vn", email: "hoangxuannhi@lhp.edu.vn" },
];

export const LOGINS: Login[] = [
  { id: "login-admin", email: "admin@truonghocso.vn", name: "Admin Trường học số Quốc gia", shortName: "AD", avatarColor: "#EF4444", systemRole: "admin" },
  { id: "login-review", email: "hoidong@truonghocso.vn", name: "Hội đồng thẩm định Trường học số Quốc gia", shortName: "HĐ", avatarColor: "#20447E", systemRole: "reviewer" },
  { id: "login-hong", email: "minhhong@email.vn", name: "Nguyễn Minh Hồng", shortName: "MH", avatarColor: "#F59E0B" },
  { id: "login-thu", email: "anhthu@nxbgd.vn", name: "Đoàn Thuận Anh Thư", shortName: "AT", avatarColor: "#20447E" },
  { id: "login-hieu", email: "letrunghieu@thcs-ltk.edu.vn", name: "Lê Trung Hiếu", shortName: "LH", avatarColor: "#F59E0B" },
  { id: "login-nhi", email: "hoangxuannhi@lhp.edu.vn", name: "Hoàng Xuân Nhi", shortName: "HN", avatarColor: "#2563EB" },
  { id: "login-dat", email: "quocdat@nxbgd.vn", name: "Phạm Quốc Đạt", shortName: "QĐ", avatarColor: "#237BD3" },
];

export const MEMBERSHIPS: Membership[] = [
  // Đoàn Thuận Anh Thư = Chủ sở hữu NXB (toàn cây)
  { id: "ms-thu-nxbgd", loginId: "login-thu", nodeId: "nxbgd", role: "owner", lockedByPin: false },
  // Phạm Quốc Đạt = Quản lý Chi nhánh Toán
  { id: "ms-dat-toan", loginId: "login-dat", nodeId: "nxbgd-toan", role: "manager", lockedByPin: false },
  // Nguyễn Minh Hồng: cá nhân (owner) + CTV NXB (khoá PIN) + Quản lý VietEdu
  { id: "ms-hong-personal", loginId: "login-hong", nodeId: "pn-hong", role: "owner", lockedByPin: false },
  { id: "ms-hong-nxbgd", loginId: "login-hong", nodeId: "nxbgd-van", role: "editor", lockedByPin: true, pin: "1234" },
  { id: "ms-hong-vietedu", loginId: "login-hong", nodeId: "vietedu", role: "manager", lockedByPin: false },
  // Lê Trung Hiếu: cá nhân (owner) + CTV NXB (khoá PIN để demo luồng Netflix)
  { id: "ms-hieu-personal", loginId: "login-hieu", nodeId: "pn-hieu", role: "owner", lockedByPin: false },
  { id: "ms-hieu-nxbgd", loginId: "login-hieu", nodeId: "nxbgd", role: "editor", lockedByPin: true, pin: "1234" },
  // Hoàng Xuân Nhi: cá nhân (owner) + Quản lý NXB
  { id: "ms-nhi-personal", loginId: "login-nhi", nodeId: "pn-nhi", role: "owner", lockedByPin: false },
  { id: "ms-nhi-nxbgd", loginId: "login-nhi", nodeId: "nxbgd", role: "manager", lockedByPin: false },
];

/**
 * Thành viên "tĩnh" — chỉ hiển thị trong màn Thành viên & vai trò, không có login
 * tương ứng (không đăng nhập được). Dùng tên thật để demo danh sách thành viên.
 */
export interface StaticMember {
  id: string;
  nodeId: string;
  name: string;
  shortName: string;
  email: string;
  role: OrgRoleId;
  avatarColor: string;
}

export const STATIC_MEMBERS: StaticMember[] = [
  { id: "sm-mai", nodeId: "nxbgd", name: "Trần Thị Mai", shortName: "TM", email: "thimai@nxbgd.vn", role: "manager", avatarColor: "#0EA5A4" },
  { id: "sm-long", nodeId: "nxbgd-toan", name: "Vũ Đức Long", shortName: "VL", email: "duclong@nxbgd.vn", role: "editor", avatarColor: "#7C3AED" },
  { id: "sm-chi", nodeId: "nxbgd-van", name: "Đỗ Quỳnh Chi", shortName: "QC", email: "quynhchi@nxbgd.vn", role: "editor", avatarColor: "#F59E0B" },
];
