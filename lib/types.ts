export interface Workspace {
  id: string;
  name: string;
  slug: string | null;
  owner_id: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: string | null;
  status: string | null;
  updated_at: string | null;
  current_period_end: string | null;
}

export interface Task {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  sort_order: number | null;
}

export interface CrmPipeline {
  id: string;
  workspace_id: string;
  name: string;
}

export interface CrmDeal {
  id: string;
  pipeline_id: string;
  title: string;
  value: number | null;
  stage: string | null;
  created_at: string;
}
