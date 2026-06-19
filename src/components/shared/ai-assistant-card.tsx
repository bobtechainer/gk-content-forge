import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface AiAssistantCardProps {
  tips: string[];
  /** ms between rotating tips */
  interval?: number;
}

/** Gradient AI assistant banner with a typing effect that rotates through personalized tips. */
export function AiAssistantCard({ tips, interval = 5000 }: AiAssistantCardProps) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const current = tips[index] ?? "";

  // Typing effect for the active tip.
  useEffect(() => {
    setTyped("");
    if (!current) return;
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setTyped(current.slice(0, i));
      if (i >= current.length) clearInterval(timer);
    }, 22);
    return () => clearInterval(timer);
  }, [current]);

  // Rotate tips.
  useEffect(() => {
    if (tips.length <= 1) return;
    const timer = setInterval(() => setIndex((v) => (v + 1) % tips.length), interval);
    return () => clearInterval(timer);
  }, [tips.length, interval]);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary to-indigo-500 p-5 text-white shadow-lg md:p-6">
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 right-16 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-h-[3rem] flex-1">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/80">
            Trợ lý AI
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-1 text-sm font-medium leading-relaxed md:text-base"
            >
              {typed}
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-white align-middle" />
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
      {tips.length > 1 && (
        <div className="relative mt-3 flex gap-1.5">
          {tips.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
