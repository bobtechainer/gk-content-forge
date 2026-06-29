import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Wand2, Loader2, Check, Sparkles, ArrowRight, Moon, Sun, Library, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { aiClient } from "@/lib/ai";
import { useContent } from "@/stores/content";
import { useCourseTheme } from "@/stores/course-theme";
import {
  useUiSystemLibrary, allUiSystemItems, type UiSystemLibraryItem,
} from "@/stores/ui-system-library";
import { ModuleStartChoice } from "./module-start-choice";
import { getResolvedThemeVars, type CourseTheme } from "@/lib/theme/resolve";
import { SYSTEM_THEMES, FONT_PAIRS } from "@/lib/theme/system-themes";
import { contrastRatio, accessibleInk, mix, ramp } from "@/lib/theme/color";
import { courseBuilderRoutePattern, uiSystemRoutePattern, type BuilderScope } from "@/lib/builder-url";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const VIBES = ["Tươi sáng", "Trang trọng", "Tối giản", "Vui nhộn"];
const ACCENT_PRESETS = ["#237BD3", "#15B79E", "#7A5AF8", "#E31B54", "#EF6820", "#1F3A8A", "#16A34A", "#334155"];
const RADIUS_STEPS = [0, 4, 6, 8, 10, 12, 16];
const STUDIO_COMPONENTS: { key: string; label: string }[] = [
  { key: "button", label: "Nút" },
  { key: "quiz", label: "Câu hỏi" },
];

function nudgeToAA(hex: string, bg: string): string {
  const target = accessibleInk(bg);
  let current = hex;
  for (let i = 0; i < 24; i++) {
    if (contrastRatio(current, bg) >= 4.5) break;
    current = mix(current, target, 0.1);
  }
  return current;
}

interface UiSystemPageProps {
  courseId: string;
  scope: BuilderScope;
  /** Module độc lập (mở từ "Tạo mới"): không gắn khoá học. */
  standalone?: boolean;
}

export function UiSystemPage({ courseId, scope, standalone = false }: UiSystemPageProps) {
  const navigate = useNavigate();
  const contentItem = useContent((s) => s.items.find((x) => x.id === courseId));
  const savedTheme = useCourseTheme((s) => s.byCourse[courseId]);

  // Module CRUD: id trỏ tới mục trong kho → đang Sửa/Xem.
  const userItems = useUiSystemLibrary((s) => s.items);
  const addToLibrary = useUiSystemLibrary((s) => s.add);
  const updateLibrary = useUiSystemLibrary((s) => s.update);
  const libItem = useMemo<UiSystemLibraryItem | undefined>(
    () => allUiSystemItems(userItems).find((i) => i.id === courseId),
    [userItems, courseId],
  );

  const pageMode: "new" | "edit" | "view" | "course" =
    standalone ? "new" : libItem ? (libItem.source === "system" ? "view" : "edit") : "course";
  const moduleMode = pageMode !== "course";
  const readOnly = pageMode === "view";

  const [theme, setTheme] = useState<CourseTheme>(libItem?.theme ?? savedTheme ?? SYSTEM_THEMES["mobifone-default"]);
  const [name, setName] = useState(libItem?.name ?? "");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [vibe, setVibe] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ name: string; rationale: string; palette: string[] } | null>(null);
  // Luồng: bắt đầu → khai báo → AI hỏi đáp → dựng (animation) → studio.
  const [step, setStep] = useState<"start" | "intake" | "brainstorm" | "generating" | "studio">(pageMode === "new" ? "start" : "studio");
  // Studio: chỉnh riêng từng component + ô AI sửa nhanh.
  const [selectedComp, setSelectedComp] = useState<string | null>(null);
  const [compRadius, setCompRadius] = useState<Record<string, number>>({});
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => { if (!libItem && savedTheme) setTheme(savedTheme); }, [savedTheme, libItem]);
  useEffect(() => {
    if (libItem) { setTheme(libItem.theme); setName(libItem.name); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libItem?.id]);

  const patchTheme = (patch: Partial<CourseTheme>) => setTheme((t) => ({ ...t, ...patch, base: "custom" }));

  const surface = theme.mode === "dark" ? mix(theme.accentSeed, "#000000", 0.86) : "#ffffff";
  const accentOnSurface = contrastRatio(theme.accentSeed, surface);
  const subject = contentItem?.subject ?? "";

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await aiClient.generateUiSystem({
        description: [description.trim(), notes.trim()].filter(Boolean).join(". ") || subject || "khoá học",
        subject,
        grade: contentItem?.grade,
        vibe: vibe ?? undefined,
      });
      setTheme(res.theme);
      setResult({ name: res.name, rationale: res.rationale, palette: res.palette });
      if (!name.trim()) setName(res.name);
    } catch {
      toast.error("Chưa dựng được giao diện, bạn thử lại nhé.");
    } finally {
      setGenerating(false);
    }
  };

  // Khai báo xong → sang bước AI hỏi đáp (chưa dựng vội).
  const handleContinue = () => setStep("brainstorm");

  // Dựng: chạy generate + animation lộ dần rồi vào studio.
  const runBuild = async () => {
    setStep("generating");
    await handleGenerate();
    await new Promise((r) => setTimeout(r, 950));
    setStep("studio");
  };

  // Bản nháp mẫu: nạp sẵn một giao diện rồi vào thẳng studio.
  const loadSample = () => {
    const t = SYSTEM_THEMES["stem"] ?? SYSTEM_THEMES["mobifone-default"];
    setTheme({ ...t, base: "custom" });
    setName((n) => n.trim() || "Giao diện mẫu STEM");
    setResult({ name: "Giao diện mẫu STEM", rationale: "Bản nháp mẫu — bạn tinh chỉnh lại tuỳ ý rồi lưu vào kho.", palette: [] });
    setStep("studio");
  };

  // Ô AI sửa nhanh: ánh xạ lời mô tả → patch token (mock).
  const applyAiEdit = async () => {
    const q = aiPrompt.trim();
    if (!q || aiBusy) return;
    setAiBusy(true);
    try {
      const p = q.toLowerCase();
      const patch: Partial<CourseTheme> = {};
      if (/(ấm|cam|nóng)/.test(p)) patch.accentSeed = "#EF6820";
      else if (/(mát|ngọc|teal)/.test(p)) patch.accentSeed = "#15B79E";
      else if (/(tím|sang trọng)/.test(p)) patch.accentSeed = "#7A5AF8";
      else if (/(đỏ)/.test(p)) patch.accentSeed = "#E31B54";
      else if (/(xanh|biển|dương)/.test(p)) patch.accentSeed = "#237BD3";
      if (/(mềm|bo nhiều|tròn)/.test(p)) patch.radiusStep = 16;
      if (/(vuông|sắc|cứng)/.test(p)) patch.radiusStep = 0;
      if (/(tối|dark|đêm)/.test(p)) patch.mode = "dark";
      if (/(sáng|light|ban ngày)/.test(p)) patch.mode = "light";
      if (/(thoáng|rộng)/.test(p)) patch.density = "spacious";
      if (/(gọn|chật|dày)/.test(p)) patch.density = "compact";
      await new Promise((r) => setTimeout(r, 500));
      if (Object.keys(patch).length) { patchTheme(patch); toast.success("Đã chỉnh giao diện theo yêu cầu của bạn."); }
      else toast("Mình chưa rõ ý — thử nói về màu, bo góc, sáng/tối hoặc mật độ nhé.");
      setAiPrompt("");
    } finally {
      setAiBusy(false);
    }
  };

  const handleApply = () => {
    const safeAccent = accentOnSurface < 4.5 ? nudgeToAA(theme.accentSeed, surface) : theme.accentSeed;
    useCourseTheme.getState().setTheme(courseId, { ...theme, accentSeed: safeAccent });
    toast.success("Đã áp dụng giao diện cho khoá học");
    navigate({ to: courseBuilderRoutePattern(scope), params: { id: courseId } });
  };

  const finalName = () => name.trim() || result?.name || (subject ? `Giao diện ${subject}` : "Giao diện của tôi");

  const handleSave = () => {
    const nm = finalName();
    if (pageMode === "edit") {
      updateLibrary(courseId, { name: nm, description: result?.rationale, theme });
      toast.success("Đã lưu thay đổi vào kho");
    } else {
      addToLibrary({ name: nm, description: result?.rationale, theme });
      toast.success(`Đã lưu "${nm}" vào kho giao diện`);
    }
  };

  const handleDuplicate = () => {
    const id = addToLibrary({ name: `${libItem?.name ?? finalName()} (bản sao)`, description: libItem?.description, theme });
    toast.success("Đã tạo bản sao — bạn chỉnh thoải mái nhé.");
    navigate({ to: uiSystemRoutePattern(scope), params: { id } });
  };

  const previewVars = getResolvedThemeVars(theme) as React.CSSProperties;
  // Bo góc cho từng component (ưu tiên override riêng, không thì theo bo góc chung).
  const compR = (key: string) => (compRadius[key] != null ? `${compRadius[key]}px` : "var(--course-radius)");
  const compRing = (key: string) => (selectedComp === key ? { outline: "2px solid var(--course-accent)", outlineOffset: "2px" } : undefined);
  const pickComp = (key: string) => setSelectedComp((s) => (s === key ? null : key));

  const headerTitle =
    pageMode === "new" ? "Trình tạo Giao diện"
    : pageMode === "edit" ? "Chỉnh sửa giao diện"
    : pageMode === "view" ? "Xem giao diện mẫu"
    : "Tạo giao diện · UI System";
  const headerSub =
    moduleMode ? (pageMode === "view" ? "Mẫu hệ thống · nhân bản để chỉnh sửa" : "Module độc lập · lưu vào kho để dùng lại")
    : (contentItem?.title ?? "Khoá học");

  return (
    <div className="flex h-screen flex-col bg-muted/30">
      {/* Header */}
      <header className="z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <Button variant="ghost" size="icon" className="h-8 w-8"
          aria-label={moduleMode ? "Quay lại Thư viện" : "Quay lại bài"}
          onClick={() =>
            moduleMode
              ? navigate({ to: scope === "org" ? "/org/library" : "/creator/library" })
              : navigate({ to: courseBuilderRoutePattern(scope), params: { id: courseId } })
          }>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-primary">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{headerTitle}</p>
          <p className="truncate text-[11px] text-muted-foreground">{headerSub}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {pageMode === "new" && step === "studio" && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setStep("intake")}>
              <ArrowLeft className="h-4 w-4" /> Khai báo
            </Button>
          )}
          {step === "intake" && (
            <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={handleContinue}>
              <ArrowRight className="h-4 w-4" /> Tiếp tục
            </Button>
          )}
          {step === "studio" && (
            readOnly ? (
              <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" onClick={handleDuplicate}>
                <Copy className="h-4 w-4" /> Nhân bản để chỉnh sửa
              </Button>
            ) : (
              <>
                <Button
                  variant={moduleMode ? "default" : "outline"}
                  size="sm"
                  className={cn("gap-2", moduleMode && "bg-primary text-primary-foreground hover:bg-primary-hover")}
                  onClick={handleSave}
                >
                  <Library className="h-4 w-4" /> {pageMode === "edit" ? "Lưu thay đổi" : "Lưu vào kho"}
                </Button>
                {!moduleMode && (
                  <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" size="sm" onClick={handleApply}>
                    <ArrowRight className="h-4 w-4" /> Áp dụng cho khoá học
                  </Button>
                )}
              </>
            )
          )}
        </div>
      </header>

      {step === "start" ? (
        <ModuleStartChoice kind="ui" onContinueDraft={loadSample} onBlank={() => setStep("intake")} />
      ) : step === "intake" ? (
        <IntakeStep
          name={name} setName={setName}
          description={description} setDescription={setDescription}
          notes={notes} setNotes={setNotes}
          vibe={vibe} setVibe={setVibe}
          accent={theme.accentSeed} onAccent={(c) => patchTheme({ accentSeed: c })}
          fontPairId={theme.fontPairId} onFont={(id) => patchTheme({ fontPairId: id })}
          generating={generating} onContinue={handleContinue}
        />
      ) : step === "brainstorm" ? (
        <BrainstormStep onBuild={runBuild} />
      ) : step === "generating" ? (
        <GeneratingView />
      ) : (
        <div className="flex min-h-0 flex-1">
          {/* Left: controls */}
          {!readOnly && (
            <div className="w-[340px] shrink-0 space-y-4 overflow-y-auto border-r border-border bg-card p-4">
              {/* Chỉnh riêng từng thành phần */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Chỉnh riêng thành phần</label>
                <div className="flex flex-wrap gap-1.5">
                  {STUDIO_COMPONENTS.map((c) => (
                    <button key={c.key} type="button" onClick={() => setSelectedComp((s) => (s === c.key ? null : c.key))}
                      className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium transition", selectedComp === c.key ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
                      {c.label}
                    </button>
                  ))}
                </div>
                {selectedComp ? (
                  <div className="mt-2 rounded-lg border border-border bg-muted/40 p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-foreground">Bo góc riêng · {compRadius[selectedComp] ?? theme.radiusStep}px</span>
                      {compRadius[selectedComp] != null && (
                        <button type="button" className="text-[10px] text-primary hover:underline" onClick={() => setCompRadius((m) => { const n = { ...m }; delete n[selectedComp]; return n; })}>Bỏ riêng</button>
                      )}
                    </div>
                    <input type="range" min={0} max={20} step={1} value={compRadius[selectedComp] ?? theme.radiusStep}
                      onChange={(e) => setCompRadius((m) => ({ ...m, [selectedComp]: Number(e.target.value) }))}
                      className="mt-1 w-full accent-primary" aria-label="Bo góc riêng" />
                    <p className="mt-1 text-[10px] text-muted-foreground">Chỉ áp cho “{STUDIO_COMPONENTS.find((c) => c.key === selectedComp)?.label}”. Phần còn lại theo cài đặt chung.</p>
                  </div>
                ) : (
                  <p className="mt-1.5 text-[10px] text-muted-foreground">Chọn một thành phần (hoặc bấm vào nó trong bản xem trước) để chỉnh riêng.</p>
                )}
              </div>

              <div className="h-px bg-border" />

              {/* Describe */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Mô tả phong cách bạn muốn</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Vd: tươi sáng, thân thiện cho học sinh THPT, tông xanh ngọc…"
                  className="min-h-[64px] text-xs"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {VIBES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVibe((cur) => (cur === v ? null : v))}
                      className={cn(
                        "rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                        vibe === v ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <Button className="mt-2.5 w-full gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" disabled={generating} onClick={handleGenerate}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Dựng lại giao diện
                </Button>
                {result && (
                  <div className="mt-2.5 rounded-lg border border-border bg-muted/40 p-2.5">
                    <p className="text-xs font-semibold text-foreground">{result.name}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{result.rationale}</p>
                  </div>
                )}
              </div>

              <div className="h-px bg-border" />

              {/* Accent */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Màu nhấn</label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {ACCENT_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => patchTheme({ accentSeed: c })}
                      className={cn("h-7 w-7 rounded-lg border transition", theme.accentSeed.toLowerCase() === c.toLowerCase() ? "ring-2 ring-primary ring-offset-1" : "border-border")}
                      style={{ background: c }}
                      aria-label={`Màu ${c}`}
                    />
                  ))}
                  <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border" title="Chọn màu khác">
                    <input type="color" value={theme.accentSeed} onChange={(e) => patchTheme({ accentSeed: e.target.value })} className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" aria-label="Chọn màu nhấn tuỳ ý" />
                  </label>
                </div>
                {accentOnSurface < 4.5 && (
                  <p className="mt-1.5 text-[11px] text-warning-700">Màu hơi nhạt trên nền — khi áp dụng sẽ tự chỉnh đậm hơn để đủ tương phản.</p>
                )}
              </div>

              {/* Font */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Cặp font</label>
                <select
                  value={theme.fontPairId}
                  onChange={(e) => patchTheme({ fontPairId: e.target.value })}
                  className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  {FONT_PAIRS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>

              {/* Radius */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Bo góc · {theme.radiusStep}px</label>
                <input
                  type="range" min={0} max={RADIUS_STEPS.length - 1} step={1}
                  value={Math.max(0, RADIUS_STEPS.indexOf(theme.radiusStep))}
                  onChange={(e) => patchTheme({ radiusStep: RADIUS_STEPS[Number(e.target.value)] })}
                  className="w-full accent-primary"
                  aria-label="Bo góc"
                />
              </div>

              {/* Density */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Mật độ</label>
                <div className="flex gap-1.5">
                  {(["compact", "cozy", "spacious"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => patchTheme({ density: d })}
                      className={cn("flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition", theme.density === d ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:bg-muted")}
                    >
                      {d === "compact" ? "Gọn" : d === "cozy" ? "Vừa" : "Thoáng"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">Chế độ màu</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => patchTheme({ mode: "light" })}
                    className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition", theme.mode !== "dark" ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:bg-muted")}
                  >
                    <Sun className="h-3.5 w-3.5" /> Sáng
                  </button>
                  <button
                    type="button"
                    onClick={() => patchTheme({ mode: "dark" })}
                    className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-medium transition", theme.mode === "dark" ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:bg-muted")}
                  >
                    <Moon className="h-3.5 w-3.5" /> Tối
                  </button>
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* AI sửa nhanh */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-foreground">AI sửa nhanh</label>
                <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background p-1.5 focus-within:border-primary">
                  <Sparkles className="ml-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void applyAiEdit(); } }}
                    placeholder="Vd: tông ấm hơn, bo góc mềm…"
                    className="h-6 flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground" />
                  <button type="button" onClick={() => void applyAiEdit()} disabled={!aiPrompt.trim() || aiBusy}
                    className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground transition disabled:opacity-40" aria-label="Gửi yêu cầu cho AI">
                    {aiBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3 w-3" />}
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">Mô tả thay đổi, AI chỉnh giúp bạn (màu, bo góc, sáng/tối, mật độ).</p>
              </div>
            </div>
          )}

          {/* Right: live preview */}
          <div className="min-h-0 flex-1 overflow-y-auto p-6">
            <p className="mb-3 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Xem trước trực tiếp</p>
            <div className="mx-auto max-w-2xl" data-course-theme style={previewVars}>
              <div
                className="overflow-hidden rounded-2xl border shadow-sm"
                style={{ background: "var(--course-surface)", borderColor: "color-mix(in srgb, var(--course-ink) 12%, transparent)" }}
              >
                <div className="p-6" style={{ fontFamily: "var(--course-font-body)" }}>
                  <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: "var(--course-accent)" }}>
                    Chương 2 · {contentItem?.subject || "Bài học"}
                  </span>
                  <h1 className="mt-1.5 text-2xl font-extrabold" style={{ fontFamily: "var(--course-font-heading)", color: "var(--course-ink)" }}>
                    Các yếu tố ảnh hưởng tốc độ phản ứng
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--course-ink)", opacity: 0.82 }}>
                    Nhiệt độ, nồng độ, diện tích bề mặt và chất xúc tác đều có thể làm thay đổi tốc độ của một phản ứng hoá học. Hiểu rõ từng yếu tố giúp em giải thích nhiều hiện tượng trong đời sống.
                  </p>

                  <div
                    className="mt-4 flex items-start gap-2 p-3"
                    style={{ background: "var(--course-accent-soft)", color: "var(--course-soft-ink)", borderRadius: "var(--course-radius)" }}
                  >
                    <Check className="mt-0.5 h-4 w-4 shrink-0" />
                    <p className="text-[13px]">Ghi nhớ: tăng nhiệt độ thường làm tốc độ phản ứng tăng lên đáng kể.</p>
                  </div>

                  <div
                    className="-mx-1 mt-4 flex cursor-pointer flex-wrap items-center gap-2 rounded-lg px-1 py-1"
                    style={compRing("button")}
                    onClick={() => pickComp("button")}
                  >
                    <span
                      className="inline-flex items-center px-4 py-2 text-sm font-semibold"
                      style={{ background: "var(--course-accent)", color: "var(--course-accent-fg)", borderRadius: compR("button") }}
                    >
                      Tiếp tục học
                    </span>
                    <span
                      className="inline-flex items-center border px-4 py-2 text-sm font-medium"
                      style={{ borderColor: "var(--course-accent)", color: "var(--course-accent)", borderRadius: compR("button") }}
                    >
                      Làm bài tập
                    </span>
                  </div>

                  {/* Quiz preview */}
                  <div className="-mx-1 mt-5 cursor-pointer rounded-lg px-1 py-1" style={compRing("quiz")} onClick={() => pickComp("quiz")}>
                    <p className="text-sm font-semibold" style={{ color: "var(--course-ink)" }}>Câu hỏi nhanh</p>
                    {["Chất xúc tác làm tăng tốc độ phản ứng", "Giảm nhiệt độ luôn tăng tốc độ", "Diện tích bề mặt không ảnh hưởng"].map((opt, i) => (
                      <div
                        key={i}
                        className="mt-2 flex items-center gap-2.5 border p-2.5"
                        style={{ borderColor: i === 0 ? "var(--course-accent)" : "color-mix(in srgb, var(--course-ink) 12%, transparent)", borderRadius: compR("quiz"), color: "var(--course-ink)" }}
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full" style={{ background: i === 0 ? "var(--course-accent)" : "transparent", border: i === 0 ? "none" : "1px solid color-mix(in srgb, var(--course-ink) 30%, transparent)" }}>
                          {i === 0 && <Check className="h-3 w-3" style={{ color: "var(--course-accent-fg)" }} />}
                        </span>
                        <span className="text-[13px]">{opt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Palette + font readout */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <div className="flex gap-1.5">
                  {[ramp(theme.accentSeed).soft, ramp(theme.accentSeed).accent, ramp(theme.accentSeed).strong].map((c) => (
                    <span key={c} className="h-6 w-10 rounded-md border border-border" style={{ background: c }} title={c} />
                  ))}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {FONT_PAIRS.find((f) => f.id === theme.fontPairId)?.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Bước 2 — AI hỏi đáp (đào sâu yêu cầu) ──────────────────────── */

function BrainstormStep({ onBuild }: { onBuild: () => void }) {
  const QUESTIONS = [
    { q: "Khoá này chủ yếu dành cho ai?", opts: ["Học sinh THPT", "Sinh viên", "Người đi làm"] },
    { q: "Bạn muốn cảm giác thiên về điều gì hơn?", opts: ["Năng lượng, vui", "Tin cậy, rõ ràng", "Tối giản"] },
  ];
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const cur = QUESTIONS[idx];
  const pick = (opt: string) => {
    setAnswers((a) => [...a, opt]);
    if (idx + 1 < QUESTIONS.length) setIdx(idx + 1);
    else onBuild();
  };
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-xl px-6 py-10">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-primary"><Sparkles className="h-4 w-4" /></span>
          <span className="text-xs text-muted-foreground">Mình hỏi nhanh vài ý để dựng đúng gu của bạn nhé</span>
        </div>
        {answers.map((a, i) => (
          <div key={i} className="mt-3">
            <div className="rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">{QUESTIONS[i].q}</div>
            <div className="mt-1.5 flex justify-end"><span className="rounded-2xl rounded-br-sm bg-primary px-3 py-1.5 text-xs text-primary-foreground">{a}</span></div>
          </div>
        ))}
        <div className="mt-3">
          <div className="rounded-2xl rounded-tl-sm border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">{cur.q}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cur.opts.map((o) => (
              <button key={o} type="button" onClick={() => pick(o)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:bg-accent">{o}</button>
            ))}
          </div>
        </div>
        <button type="button" onClick={onBuild} className="mt-6 text-xs font-medium text-muted-foreground transition hover:text-primary">Bỏ qua, dựng luôn →</button>
      </div>
    </div>
  );
}

/* ─── Bước 3 — Dựng (animation lộ dần) ───────────────────────────── */

function GeneratingView() {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Đang dựng hệ giao diện cho bạn…
      </div>
      <div className="grid w-full max-w-md grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Bước 1 — Khai báo phong cách (kiểu Claude Design) ──────────── */

function IntakeStep({
  name, setName, description, setDescription, notes, setNotes, vibe, setVibe,
  accent, onAccent, fontPairId, onFont, generating, onContinue,
}: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  vibe: string | null;
  setVibe: (fn: (cur: string | null) => string | null) => void;
  accent: string;
  onAccent: (c: string) => void;
  fontPairId: string;
  onFont: (id: string) => void;
  generating: boolean;
  onContinue: () => void;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-bold text-foreground">Dựng hệ giao diện của bạn</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kể cho mình về phong cách bạn muốn, đính kèm vài gợi ý nếu có — phần còn lại để mình lo.</p>
        </div>

        <div className="mt-7 space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Tên & mô tả ngắn</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Vd: Giao diện khoá Hoá 10" className="mb-2 h-10" />
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Vd: tươi sáng, thân thiện học sinh THPT, tông xanh ngọc, nhiều khoảng trắng…" className="min-h-[72px] text-sm" />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-foreground">Gợi ý phong cách <span className="font-normal text-muted-foreground">(tuỳ chọn)</span></p>
            <div className="space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-medium text-foreground">Màu thương hiệu</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {ACCENT_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => onAccent(c)}
                      className={cn("h-7 w-7 rounded-lg border transition", accent.toLowerCase() === c.toLowerCase() ? "ring-2 ring-primary ring-offset-1" : "border-border")}
                      style={{ background: c }}
                      aria-label={`Màu ${c}`}
                    />
                  ))}
                  <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border" title="Chọn màu khác">
                    <input type="color" value={accent} onChange={(e) => onAccent(e.target.value)} className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0" aria-label="Chọn màu tuỳ ý" />
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs font-medium text-foreground">Phông chữ</span>
                <select
                  value={fontPairId}
                  onChange={(e) => onFont(e.target.value)}
                  className="h-9 flex-1 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground outline-none focus:border-primary"
                >
                  {FONT_PAIRS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-24 shrink-0 pt-1 text-xs font-medium text-foreground">Cảm giác</span>
                <div className="flex flex-wrap gap-1.5">
                  {VIBES.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVibe((cur) => (cur === v ? null : v))}
                      className={cn("rounded-full border px-2.5 py-1 text-[11px] font-medium transition", vibe === v ? "border-primary bg-accent text-primary" : "border-border text-muted-foreground hover:border-primary/40")}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">Ghi chú thêm <span className="font-normal text-muted-foreground">(tuỳ chọn)</span></label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Vd: bo góc mềm, giọng thân thiện nhưng chuyên nghiệp, tránh màu quá chói…" className="min-h-[60px] text-sm" />
          </div>

          <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary-hover" disabled={generating} onClick={onContinue}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Tiếp tục dựng
          </Button>
        </div>
      </div>
    </div>
  );
}
