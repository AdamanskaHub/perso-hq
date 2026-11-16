/**
 * Upgrade stored/exported data from an older schema version to the current one.
 *
 * Version 1 is the first release, so there is nothing to migrate yet. When the shape changes:
 *   1. bump SCHEMA_VERSION in types.ts
 *   2. add a step below, e.g. `if (v < 2) data = addFieldX(data)`
 */
export function migrate(data: unknown, fromVersion: number): unknown {
  const v = fromVersion;
  const out = data;
  // if (v < 2) out = ...
  void v;
  return out;
}
