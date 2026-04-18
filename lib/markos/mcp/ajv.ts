'use strict';
// Phase 202 Plan 04: Dual-export re-export stub.
const a = require('./ajv.cjs');

export const ajv: unknown = a.ajv;
export const STRICT_OPTS: Readonly<Record<string, unknown>> = a.STRICT_OPTS;
export const compileToolSchemas = a.compileToolSchemas as (
  schemasByTool: Record<string, { input: unknown; output: unknown }>
) => void;
export const getToolValidator = a.getToolValidator as (
  tool_id: string
) => {
  validateInput: ((data: unknown) => boolean) & { errors?: unknown[] | null };
  validateOutput: ((data: unknown) => boolean) & { errors?: unknown[] | null };
};
