import { mockAiClient } from "./mock-client";
import type { AiClient } from "./types";

export const aiClient: AiClient = mockAiClient;

export type { AiClient } from "./types";
export type {
  Storyboard,
  StoryboardItem,
  StoryboardSection,
  StoryboardRequest,
  FillRequest,
  CompanionRequest,
  QuizFromContentRequest,
  PublishAnalysis,
} from "./types";
