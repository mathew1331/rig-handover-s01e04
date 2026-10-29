import type { DigestRow, Night } from '../digest/types.js';

const DASH = '—';

function marked(r: DigestRow): boolean {
  return r.retries >= 3 || r.lastStatus === 'fail';
}

function Row({ r }: { r: DigestRow }) {
  return (
    <tr class={marked(r) ? 'warn' : undefined}>
      <td>{r.job}</td>
      <td>{r.owner ?? DASH}</td>
      <td>{r.runs}</td>
      <td>{r.retries >= 3 ? `${r.retries} ⚠` : r.retries}</td>
      <td>{r.lastStatus === 'fail' ? 'fail ⚠' : r.lastStatus}</td>
      <td>{r.lastError ?? DASH}</td>
      <td>{r.first}</td>
      <td>{r.last}</td>
    </tr>
  );
}

export function DigestPage({ night }: { night: Night }) {
  const rows = [...night.rows].sort((a, b) => a.job.localeCompare(b.job));
  return (
    <>
      <h1>digest · {night.night}</h1>
      {rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Row r={r} />
            ))}
          </tbody>
        </table>
      )}
      {night.badLines > 0 && <p class="mute">{night.badLines} unreadable line(s) skipped</p>}
    </>
  );
}
