export const TARGET_TYPES = ['ACTIVITY', 'USER'] as const;
export const REPORT_REASONS = ['SPAM', 'INAPPROPRIATE', 'NO_SHOW', 'FAKE_LOCATION', 'OTHER'] as const;
export const REPORT_STATUSES = ['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'] as const;

export type TargetType = (typeof TARGET_TYPES)[number];
export type ReportTargetType = TargetType;
export type ReportReason = (typeof REPORT_REASONS)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface Report {
  _id: string;
  reporterId?: string;
  targetType: TargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  adminNotes?: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportInput {
  targetType: TargetType;
  targetId: string;
  reason: ReportReason;
  description: string;
  status?: ReportStatus;
  adminNotes?: string;
}

export interface ReportReviewInput {
  status: ReportStatus;
  adminNotes?: string;
}
