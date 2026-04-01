export type EntityType = "company" | "mir" | "msp" | "icp" | "segment" | "campaign";

export const ENTITY_ORDER: EntityType[] = ["company", "mir", "msp", "icp", "segment", "campaign"];

export type PublishState = "draft" | "review" | "published";

export type PublishMeta = {
  state: PublishState;
  schemaVersion: string;
  updatedAt: string;
  updatedBy: string;
  reviewer?: string;
};

export type Company = {
  id: string;
  workspaceId: string;
  name: string;
  website?: string;
  description: string;
  publish: PublishMeta;
};

export type MirDocument = {
  id: string;
  workspaceId: string;
  section: string;
  content: string;
  publish: PublishMeta;
};

export type MspPlan = {
  id: string;
  workspaceId: string;
  channel: string;
  objective: string;
  kpiTarget: string;
  publish: PublishMeta;
};

export type Icp = {
  id: string;
  workspaceId: string;
  title: string;
  pains: string[];
  jobsToBeDone: string[];
  publish: PublishMeta;
};

export type Segment = {
  id: string;
  workspaceId: string;
  name: string;
  criteria: string[];
  publish: PublishMeta;
};

export type Campaign = {
  id: string;
  workspaceId: string;
  name: string;
  status: "planned" | "active" | "paused" | "closed";
  kpiName: string;
  kpiTarget: string;
  publish: PublishMeta;
};

export const companySchema = {
  entity: "company",
  required: ["id", "workspaceId", "name", "description", "publish"],
};

export const mirDocumentSchema = {
  entity: "mir",
  required: ["id", "workspaceId", "section", "content", "publish"],
};

export const mspPlanSchema = {
  entity: "msp",
  required: ["id", "workspaceId", "channel", "objective", "kpiTarget", "publish"],
};

export const icpSchema = {
  entity: "icp",
  required: ["id", "workspaceId", "title", "pains", "jobsToBeDone", "publish"],
};

export const segmentSchema = {
  entity: "segment",
  required: ["id", "workspaceId", "name", "criteria", "publish"],
};

export const campaignSchema = {
  entity: "campaign",
  required: ["id", "workspaceId", "name", "status", "kpiName", "kpiTarget", "publish"],
};
