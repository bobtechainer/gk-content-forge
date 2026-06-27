import { aiClient } from "@/lib/ai";
import type { Storyboard, StoryboardItem } from "@/lib/ai/types";
import type { CourseBlock, CourseBlockType } from "@/stores/course";

export interface FillOrchestrationArgs {
  storyboard: Storyboard;
  meta: { subject: string; grade: string; topic: string };
  /** Caller curries courseId+lessonId — returns the new block id */
  addBlock: (type: CourseBlockType) => string;
  /** Caller curries courseId+lessonId */
  updateBlock: (blockId: string, patch: Partial<CourseBlock>) => void;
  onProgress?: (done: number, total: number) => void;
}

export async function fillStoryboard(args: FillOrchestrationArgs): Promise<void> {
  const { storyboard, meta, addBlock, updateBlock, onProgress } = args;
  const allItems: StoryboardItem[] = storyboard.sections.flatMap((s) => s.items);
  const total = allItems.length;
  let done = 0;
  for (const item of allItems) {
    const patch = await aiClient.fillBlock({ item, ...meta });
    const blockId = addBlock(item.blockType);
    updateBlock(blockId, { ...patch, aiGenerated: true });
    done++;
    onProgress?.(done, total);
  }
}
