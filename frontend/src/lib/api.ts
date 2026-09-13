import axios from "axios";

import type {
  ContextPriority,
  ReviewContextBudget,
} from "@/types/context-budget";

const api = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL ??
    "https://codeguard-ai-x5uw.onrender.com/api",

  withCredentials: true,

  headers: {
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| Attach JWT access token
|--------------------------------------------------------------------------
*/

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

/*
|--------------------------------------------------------------------------
| Pull Request Types
|--------------------------------------------------------------------------
*/

export interface PullRequest {
  id: number;
  repository_id: number;
  title: string;
  github_pr_id: string;
  number: number;
  description: string | null;
  state: string;
  source_branch: string;
  target_branch: string;
  author: string | null;
  html_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PullRequestFile {
  filename: string;
  status: string | null;
  additions: number;
  deletions: number;
  changes: number;
  patch: string | null;
  sha: string | null;
}

/*
|--------------------------------------------------------------------------
| Pull Request API
|--------------------------------------------------------------------------
*/

/**
 * Get a single pull request.
 */
export async function getPullRequest(
  repositoryId: number,
  pullNumber: number
): Promise<PullRequest> {
  const response = await api.get<PullRequest>(
    `/github/repositories/${repositoryId}/pull-requests/${pullNumber}`
  );

  return response.data;
}

/**
 * Get files changed in a pull request.
 */
export async function getPullRequestFiles(
  repositoryId: number,
  pullNumber: number
): Promise<PullRequestFile[]> {
  const response = await api.get<PullRequestFile[]>(
    `/github/repositories/${repositoryId}/pull-requests/${pullNumber}/files`
  );

  return response.data;
}

/*
|--------------------------------------------------------------------------
| Review Types
|--------------------------------------------------------------------------
*/

export interface Review {
  id: number;
  repository_id: number;
  pull_request_id: number;
  score: number;
  status: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReviewFile {
  path: string;
  language: string;
  content: string;
  findings_count: number;
}

export interface ReviewFinding {
  id: number;
  review_id: number;

  severity:
    | "critical"
    | "high"
    | "medium"
    | "low"
    | string;

  category: string;
  title: string;
  description: string;

  file: string;
  line: number;

  why_it_matters: string | null;
  suggested_fix: string | null;
  fixed_code: string | null;

  confidence: number | null;

  created_at: string;
}

/*
|--------------------------------------------------------------------------
| Review Job Types
|--------------------------------------------------------------------------
*/

export interface ReviewJobResponse {
  id: number;
  review_id: number | null;
  repository_id: number;

  status:
    | "queued"
    | "running"
    | "processing"
    | "ai"
    | "analyzing"
    | "completed"
    | "partial"
    | "failed"
    | "error"
    | string;

  error: string | null;

  created_at: string;
  updated_at: string;
}

/*
|--------------------------------------------------------------------------
| Context Budget Types
|--------------------------------------------------------------------------
|
| These types are imported from:
|
| src/types/context-budget.ts
|
| Do NOT redefine ReviewContextBudget or ContextPriority here.
|
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Review Response
|--------------------------------------------------------------------------
*/

export interface ReviewRunResponse {
  review: Review;

  findings: ReviewFinding[];

  files: ReviewFile[];

  files_analyzed: number;
  files_failed: number;

  static_findings: number;
  ai_findings: number;

  context_budget: ReviewContextBudget | null;
}

/*
|--------------------------------------------------------------------------
| Review API
|--------------------------------------------------------------------------
*/

/**
 * Get a completed review by ID.
 */
export async function getReview(
  reviewId: number
): Promise<ReviewRunResponse> {
  const response = await api.get<ReviewRunResponse>(
    `/reviews/${reviewId}`
  );

  return response.data;
}

/**
 * Start an asynchronous AI review.
 *
 * Backend:
 * POST /reviews/{pullRequestId}/run-async
 */
export async function runAsyncReview(
  pullRequestId: number
): Promise<{
  job_id: number;
  review_id: number;
  status: string;
}> {
  const response = await api.post<{
    job_id: number;
    review_id: number;
    status: string;
  }>(`/reviews/${pullRequestId}/run-async`);

  return response.data;
}


export async function getReviewJob(
  jobId: number
): Promise<ReviewJobResponse> {
  const response = await api.get<ReviewJobResponse>(
    `/reviews/jobs/${jobId}`
  );

  return response.data;
}



export default api;



export type {
  ContextPriority,
  ReviewContextBudget,
};