import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { CURRICULUM, type CurriculumLesson } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

export function CurriculumTree({
  onSelectLesson,
  selectedLessonId,
}: {
  onSelectLesson?: (lesson: CurriculumLesson) => void;
  selectedLessonId?: string;
}) {
  return (
    <div className="space-y-1 text-sm">
      {CURRICULUM.map((grade) => (
        <TreeNode key={grade.id} label={grade.name} defaultOpen>
          {grade.subjects.map((subject) => (
            <TreeNode key={subject.id} label={subject.name}>
              {subject.strands.map((strand) => (
                <TreeNode key={strand.id} label={strand.title}>
                  {strand.chapters.map((chapter) => (
                    <TreeNode key={chapter.id} label={chapter.title}>
                      {chapter.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => onSelectLesson?.(lesson)}
                          className={cn(
                            "block w-full rounded-md px-3 py-1.5 text-left hover:bg-muted",
                            selectedLessonId === lesson.id && "bg-accent text-accent-foreground",
                          )}
                        >
                          {lesson.title}
                        </button>
                      ))}
                    </TreeNode>
                  ))}
                </TreeNode>
              ))}
            </TreeNode>
          ))}
        </TreeNode>
      ))}
    </div>
  );
}

function TreeNode({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left font-medium text-foreground hover:bg-muted"
      >
        <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-90")} />
        {label}
      </button>
      {open && <div className="ml-4 border-l border-border pl-2">{children}</div>}
    </div>
  );
}
