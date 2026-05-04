type ScoreableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ScoreableValue[]
  | { [key: string]: ScoreableValue };

type BrandVoiceOptions = {
  dev_vocab?: readonly string[];
  ai_phrases?: readonly string[];
  registers?: readonly string[];
  anti?: readonly string[];
};

const scorers = require('./scorers.cjs') as {
  ARCHETYPE_TOKENS: Readonly<Record<string, readonly string[]>>;
  BRAND_PREFERRED_DEV_VOCAB: readonly string[];
  BRAND_PREFERRED_AI_PHRASES: readonly string[];
  BRAND_PREFERRED_REGISTERS: readonly string[];
  BRAND_PREFERRED: readonly string[];
  BRAND_ANTI: readonly string[];
  NEURO_PILLARS: Readonly<Record<string, readonly string[]>>;
  brandVoiceScore(textOutput: string, opts?: BrandVoiceOptions): number;
  claimCheckScore(toolOutput: ScoreableValue, expectedEvidenceIds?: readonly string[]): boolean;
  neuroSpecScore(toolOutput: ScoreableValue, expectedNeuroPillar?: string, expectedArchetype?: string): number;
};

export const ARCHETYPE_TOKENS = scorers.ARCHETYPE_TOKENS;
export const BRAND_PREFERRED_DEV_VOCAB = scorers.BRAND_PREFERRED_DEV_VOCAB;
export const BRAND_PREFERRED_AI_PHRASES = scorers.BRAND_PREFERRED_AI_PHRASES;
export const BRAND_PREFERRED_REGISTERS = scorers.BRAND_PREFERRED_REGISTERS;
export const BRAND_PREFERRED = scorers.BRAND_PREFERRED;
export const BRAND_ANTI = scorers.BRAND_ANTI;
export const NEURO_PILLARS = scorers.NEURO_PILLARS;

export function brandVoiceScore(textOutput: string, opts: BrandVoiceOptions = {}): number {
  return scorers.brandVoiceScore(textOutput, opts);
}

export function claimCheckScore(toolOutput: ScoreableValue, expectedEvidenceIds: readonly string[] = []): boolean {
  return scorers.claimCheckScore(toolOutput, expectedEvidenceIds);
}

export function neuroSpecScore(toolOutput: ScoreableValue, expectedNeuroPillar = '', expectedArchetype = ''): number {
  return scorers.neuroSpecScore(toolOutput, expectedNeuroPillar, expectedArchetype);
}
