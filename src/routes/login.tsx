import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { LOGINS } from "@/lib/org-mock-data";
import type { Login } from "@/lib/org/types";
import { ProfilePicker } from "@/components/identity/profile-picker";
import { useIdentity } from "@/stores/identity";
import { useSession } from "@/stores/session";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Đăng nhập — GK Content Studio" },
      {
        name: "description",
        content: "Chọn tài khoản để bắt đầu trải nghiệm demo GK Content Studio.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const loginAs = useIdentity((s) => s.loginAs);
  const logout = useIdentity((s) => s.logout);
  const setView = useSession((s) => s.setView);
  const navigate = useNavigate();
  // Chọn hồ sơ (Netflix flow) hiển thị NGAY trên /login — không tách route riêng.
  const [picking, setPicking] = useState(false);

  const pick = (login: Login) => {
    loginAs(login.id);
    // Tài khoản hệ thống (admin / hội đồng thẩm định) không có hồ sơ tổ chức —
    // set view-group và vào thẳng màn làm việc.
    if (login.systemRole === "admin") {
      setView("admin");
      navigate({ to: "/admin/dashboard" });
      return;
    }
    if (login.systemRole === "reviewer") {
      setView("reviewer");
      navigate({ to: "/reviewer/queue" });
      return;
    }
    // Tài khoản thường → chọn hồ sơ ngay tại đây.
    setPicking(true);
  };

  if (picking) {
    return (
      <ProfilePicker
        onBack={() => {
          logout();
          setPicking(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted via-accent to-muted">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/assets/logo/Logomark.svg" alt="Trường học số" className="h-9 w-9" />
            <span className="text-lg font-semibold text-foreground">GK Content Studio</span>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-100 px-3 py-1 text-xs font-medium text-warning-700">
            <Sparkles className="h-3 w-3" /> Demo Mode
          </span>
        </header>

        <div className="mt-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Chào mừng đến với <span className="text-primary">GK Studio</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Đây là bản demo. Chọn một tài khoản bên dưới để đăng nhập. Tài khoản có nhiều hồ sơ sẽ
            mời bạn chọn hồ sơ làm việc ở bước tiếp theo.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LOGINS.map((login, i) => (
            <motion.button
              key={login.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              onClick={() => pick(login)}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left shadow-sm transition hover:border-primary hover:shadow-xl"
            >
              <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition group-hover:scale-150"
                style={{ backgroundColor: login.avatarColor }}
              />
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white"
                style={{ backgroundColor: login.avatarColor }}
              >
                {login.shortName}
              </div>
              <div className="mt-4 break-words font-semibold text-foreground">{login.name}</div>
              <p className="mt-1 break-all text-xs text-muted-foreground">{login.email}</p>
              <div className="mt-4 flex items-center text-xs font-medium text-primary">
                {login.systemRole ? "Vào hệ thống" : "Đăng nhập"}{" "}
                <ArrowRight className="ml-1 h-3 w-3 transition group-hover:translate-x-1" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
