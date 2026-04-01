import type { EntityType, PublishMeta } from "./schema";

export type ContractSnapshot = {
  id: string;
  workspaceId: string;
  entityType: EntityType;
  schemaVersion: string;
  publishedAt: string;
  publishedBy: string;
  state: "published";
  humanRenderedContent: string;
  structuredContract: Record<string, unknown>;
  tags: string[];
};

export function canPublish(meta: PublishMeta): boolean {
  return meta.state === "review" || meta.state === "published";
}

export function buildSnapshot(input: {
  id: string;
  workspaceId: string;
  entityType: EntityType;
  publish: PublishMeta;
  humanRenderedContent: string;
  structuredContract: Record<string, unknown>;
  tags?: string[];
}): ContractSnapshot {
  if (!canPublish(input.publish)) {
    throw new Error("Entity must be at review or published state before snapshot generation.");
  }

  return {
    id: input.id,
    workspaceId: input.workspaceId,
    entityType: input.entityType,
    schemaVersion: input.publish.schemaVersion,
    publishedAt: new Date().toISOString(),
    publishedBy: input.publish.reviewer || input.publish.updatedBy,
    state: "published",
    humanRenderedContent: input.humanRenderedContent,
    structuredContract: input.structuredContract,
    tags: input.tags || [],
  };
}
