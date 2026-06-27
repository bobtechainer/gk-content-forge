import type { CourseBlock, CourseBlockType } from "@/stores/course";

export interface StoryboardItem {
  id: string;
  blockType: CourseBlockType;
  intent: string;
  learningGoal: string;
}

export interface StoryboardSection {
  id: string;
  title: string;
  items: StoryboardItem[];
}

export interface Storyboard {
  sections: StoryboardSection[];
}

export interface StoryboardRequest {
  subject: string;
  grade: string;
  topic: string;
  objectives?: string;
  durationMin?: number;
}

export interface FillRequest {
  item: StoryboardItem;
  subject: string;
  grade: string;
  topic: string;
}

export interface CompanionRequest {
  text: string;
  action: "shorten" | "lengthen" | "tone-friendly" | "tone-formal" | "fix";
}

export interface QuizFromContentRequest {
  sourceText: string;
  count: number;
}

export interface PublishAnalysis {
  score: number;
  tags: string[];
  description: string;
  notes: string[];
}

export interface AiClient {
  generateStoryboard(req: StoryboardRequest): Promise<Storyboard>;
  fillBlock(req: FillRequest): Promise<Partial<CourseBlock>>;
  companionEdit(req: CompanionRequest): Promise<{ text: string }>;
  quizFromContent(
    req: QuizFromContentRequest,
  ): Promise<
    { content: string; quizOptions: string[]; quizCorrect: number; quizExplanation: string }[]
  >;
}
