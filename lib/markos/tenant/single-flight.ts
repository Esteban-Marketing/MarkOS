// Phase 201.1 D-104: TypeScript dual-export for the single-flight Promise coalescer.
// Runtime lives in single-flight.cjs.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const sf = require('./single-flight.cjs');

export type SingleFlight = {
  coalesce<T>(key: string, fn: () => Promise<T>): Promise<T>;
  inflightSize(): number;
  clear(): void;
};

export const createSingleFlight: () => SingleFlight = sf.createSingleFlight;
export const singleFlight: SingleFlight = sf.singleFlight;
