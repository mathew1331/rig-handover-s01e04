export type JobStatus = 'ok' | 'retry' | 'fail';

// One row per job in a night's run log. Times keep the offset from the log (styleguide).
export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: JobStatus;
  lastError: string | null;
  first: string;
  last: string;
};

export type Night = {
  night: string;
  rows: DigestRow[];
  badLines: number;
};

// Returns null when runs/<night>.jsonl does not exist. Lines that do not parse are counted in
// `badLines`, never thrown.
export type ReadNight = (runsDir: string, night: string) => Night | null;
