import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { DEMO_LOGINS } from "@/lib/mock-data";
import { getRoleHomePath } from "@/lib/taxonomy";
import { useSession } from "@/stores/session";
import { VerifiedBadge } from "@/components/shared/verified-badge";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Đăng nhập — GK Content Studio" },
      {
        name: "description",
        content: "Chọn vai trò để bắt đầu trải nghiệm demo GK Content Studio.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const setRole = useSession((s) => s.setRole);
  const navigate = useNavigate();

  const pick = (login: (typeof DEMO_LOGINS)[number]) => {
    setRole(login.roleId, login.schoolRole);
    navigate({ to: getRoleHomePath(login.roleId, login.schoolRole) as string });
  };

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
            Đây là bản demo. Chọn vai trò bên dưới để vào thẳng dashboard và trải nghiệm luồng tạo —
            duyệt — xuất bản nội dung.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {DEMO_LOGINS.map((login, i) => {
            const a = login.account;
            return (
              <motion.button
                key={login.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                onClick={() => pick(login)}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left shadow-sm transition hover:border-primary hover:shadow-xl"
              >
                <div
                  className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 transition group-hover:scale-150"
                  style={{ backgroundColor: a.avatarColor }}
                />
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold text-white"
                  style={{ backgroundColor: a.avatarColor }}
                >
                  {a.shortName}
                </div>
                <div className="mt-4 flex items-center gap-1.5">
                  <span className="font-semibold text-foreground">{a.name}</span>
                  <VerifiedBadge verified={a.verified} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.accountType}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{login.tagline}</p>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{a.bio}</p>
                <div className="mt-4 flex items-center text-xs font-medium text-primary">
                  Vào dashboard{" "}
                  <ArrowRight className="ml-1 h-3 w-3 transition group-hover:translate-x-1" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
