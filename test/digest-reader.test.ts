import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/read-night.js';

describe('readNight', () => {
  const night = readNight('runs', '2026-10-28');

  it('reads 5 jobs and counts the bad line', () => {
    expect(night?.rows.map((r) => r.job)).toEqual([
      'digest/render',
      'fixtures/refresh',
      'lane/sync',
      'notes/backup',
      'rig/rotate-logs',
    ]);
    expect(night?.badLines).toBe(1);
  });

  it('counts runs and retries per job', () => {
    const fx = night?.rows.find((r) => r.job === 'fixtures/refresh');
    expect(fx).toMatchObject({ runs: 4, retries: 3, lastStatus: 'ok', owner: 'rook' });
    expect(fx?.first).toBe('2026-10-29T01:30:00+01:00');
    expect(fx?.last).toBe('2026-10-29T01:37:00+01:00');
  });

  it('keeps a row with a null owner', () => {
    expect(night?.rows.find((r) => r.job === 'digest/render')?.owner).toBeNull();
  });

  it('keeps the last error of a failed job', () => {
    expect(night?.rows.find((r) => r.job === 'notes/backup')).toMatchObject({
      lastStatus: 'fail',
      lastError: 'quota exceeded',
    });
  });

  it('returns null for a night with no file', () => {
    expect(readNight('runs', '2020-01-01')).toBeNull();
  });
});
