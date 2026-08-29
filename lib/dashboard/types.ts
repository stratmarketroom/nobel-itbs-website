export type DashboardContentSummary = {
  programmes: {
    total: number;
    published: number;
    draft: number;
    archived: number;
  };
  translationsNeedingAttention: {
    contentPages: number;
    programmes: number;
  };
};

export type DashboardOperationsSummary = {
  newContactSubmissions: number;
  learners: {
    active: number;
    archived: number;
  };
  credentials: {
    pending: number;
    valid: number;
    revoked: number;
    voided: number;
  };
};

export type AdminDashboardSummary = {
  generatedAt: string;
  content: DashboardContentSummary | null;
  operations: DashboardOperationsSummary | null;
};
