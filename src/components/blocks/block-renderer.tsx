import type { CourseBlock } from "@/stores/course";
import {
  LayoutWrapper,
  TextView,
  ImageView,
  VideoView,
  CalloutView,
  EmbedView,
  CodeView,
  MathView,
  HtmlView,
  QuizView,
  ColumnsView,
} from "./block-views";

export interface BlockRendererProps {
  block: CourseBlock;
  /** "preview" — course builder preview; "learn" — learner view. Same views for now; param reserved. */
  mode: "preview" | "learn";
  onQuizResult?: (correct: boolean) => void;
}

export function BlockRenderer({ block, mode: _mode, onQuizResult }: BlockRendererProps): React.ReactElement | null {
  // Section markers are consumed by the journey stepper, never rendered inline.
  if (block.type === "section") return null;

  if (block.type === "divider") {
    return <hr className="my-6 border-border/30" />;
  }

  if (block.type === "columns") {
    return (
      <ColumnsView block={block} BlockRenderer={BlockRenderer} />
    );
  }

  const layout = block.layout ?? "centered";

  const inner = (() => {
    switch (block.type) {
      case "text":
        return <TextView block={block} />;
      case "image":
        return <ImageView block={block} />;
      case "video":
        return <VideoView block={block} />;
      case "callout":
        return <CalloutView block={block} />;
      case "embed":
        return <EmbedView block={block} />;
      case "code":
        return <CodeView block={block} />;
      case "math":
        return <MathView block={block} />;
      case "quiz":
        return <QuizView block={block} onResult={onQuizResult} />;
      case "html":
        return <HtmlView block={block} />;
      default:
        return <div className="text-sm text-muted-foreground">{block.content}</div>;
    }
  })();

  return <LayoutWrapper layout={layout}>{inner}</LayoutWrapper>;
}
