import { createFileRoute } from "@tanstack/react-router";
import { ProfilePicker } from "@/components/identity/profile-picker";

export const Route = createFileRoute("/choose-profile")({
  head: () => ({
    meta: [
      { title: "Chọn hồ sơ — GK Content Studio" },
      {
        name: "description",
        content: "Chọn hồ sơ tổ chức hoặc cá nhân để bắt đầu làm việc.",
      },
    ],
  }),
  component: ProfilePicker,
});
