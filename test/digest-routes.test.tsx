import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const base = { adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60 };

function appWith(files: Record<string, string>) {
  const runsDir = mkdtempSync(join(tmpdir(), 'rig-runs-'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(runsDir, name), text);
  return createApp({ ...base, runsDir });
}

const line = (o: object) => JSON.stringify(o);

describe('digest page and JSON', () => {
  it('renders a night (200) and the JSON lists the same jobs in the same order', async () => {
    const app = createApp({ ...base, runsDir: 'runs' });
    const page = await app.request('/digest/2026-10-28');
    const json = await app.request('/api/digest/2026-10-28');
    expect(page.status).toBe(200);
    expect(json.status).toBe(200);
    const html = await page.text();
    const body = (await json.json()) as { rows: { job: string }[] };
    const jobs = body.rows.map((r) => r.job);
    const positions = jobs.map((j) => html.indexOf(j));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('marks retries of 3 or more and failures, shows — for a null owner', async () => {
    const html = await (await createApp({ ...base, runsDir: 'runs' }).request('/digest/2026-10-28')).text();
    expect(html).toContain('3 ⚠');
    expect(html).toContain('fail ⚠');
    expect(html).toContain('—');
  });

  it('returns 404 for a night with no file', async () => {
    const app = appWith({});
    expect((await app.request('/digest/2026-01-01')).status).toBe(404);
    expect((await app.request('/api/digest/2026-01-01')).status).toBe(404);
  });

  it('renders "nothing ran" for an empty file', async () => {
    const app = appWith({ '2026-01-02.jsonl': '' });
    const page = await app.request('/digest/2026-01-02');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('nothing ran');
    expect(((await (await app.request('/api/digest/2026-01-02')).json()) as { rows: unknown[] }).rows).toEqual([]);
  });

  it('still renders a night with a bad line and counts it', async () => {
    const app = appWith({
      '2026-01-03.jsonl': `${line({ at: '2026-01-03T01:00:00+01:00', job: 'a/b', status: 'ok', owner: 'x' })}\n{broken\n`,
    });
    const page = await app.request('/digest/2026-01-03');
    expect(page.status).toBe(200);
    expect(await page.text()).toContain('1 unreadable line(s) skipped');
    expect(((await (await app.request('/api/digest/2026-01-03')).json()) as { badLines: number }).badLines).toBe(1);
  });

  it('links each night on the board to its digest with counts', async () => {
    const html = await (await createApp({ ...base, runsDir: 'runs' }).request('/')).text();
    expect(html).toContain('href="/digest/2026-10-28"');
    expect(html).toContain('href="/digest/2026-10-27"');
    expect(html).toContain('ok ');
  });
});
