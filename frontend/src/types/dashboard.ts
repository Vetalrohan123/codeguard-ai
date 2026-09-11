export interface DashboardStats {
  average_score: number;
  total_reviews: number;
  critical_findings: number;
  total_findings: number;
}

export interface ReviewTrend {
  date: string;
  score: number;
}

export interface FindingSeverity {
  severity: "critical" | "high" | "medium" | "low";
  count: number;
}

export interface RecentReview {
  id: number;
  repository_id: number;
  pull_request_id: number | null;
  score: number | null;
  status: string;
  summary: string | null;
  created_at: string;
  updated_at: string;
  repository_name: string;
  pull_request_number: number | null;
}

export interface DashboardData {
  stats: DashboardStats;
  review_trend: ReviewTrend[];
  findings_by_severity: FindingSeverity[];
  recent_reviews: RecentReview[];
}