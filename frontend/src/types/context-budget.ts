export type PriorityTier =
  | "critical"
  | "high"
  | "medium"
  | "low";

export interface ContextFileBudget {
  path: string;
  language: string;

  characters: number;
  estimated_tokens: number;

  original_characters: number;
  truncated: boolean;
}

export interface ContextBudget {
  current_file: ContextFileBudget;

  related_files: ContextFileBudget[];

  total_characters: number;
  total_estimated_tokens: number;

  dropped_files: string[];
}

export interface ContextPriority {
  path: string;

  score: number;
  tier: PriorityTier;

  import_score: number;
  static_finding_score: number;
  size_score: number;
  language_score: number;
  dependency_score: number;

  reason: string;
}

export interface ReviewContextBudget {
  total_characters: number;
  total_estimated_tokens: number;

  files_included: number;
  files_dropped: number;
  files_truncated: number;

  priorities: ContextPriority[];

  budgets: Record<string, ContextBudget>;
}