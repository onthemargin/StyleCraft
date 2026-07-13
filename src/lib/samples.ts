import type { AuthorTarget, SampleRun } from "../shared/types.ts";

export interface SampleMeta {
  id: string;
  label: string;
  author: AuthorTarget;
}

// Static assets copied from public/ — resolve under the app's base path so it
// works both standalone ("/") and as the "/stylecraft/" sub-app.
const base = import.meta.env.BASE_URL;

export async function loadSampleIndex(): Promise<SampleMeta[]> {
  const res = await fetch(`${base}samples/index.json`);
  if (!res.ok) throw new Error("Could not load samples");
  return (await res.json()) as SampleMeta[];
}

export async function loadSample(id: string): Promise<SampleRun> {
  const res = await fetch(`${base}samples/${id}.json`);
  if (!res.ok) throw new Error(`Could not load sample "${id}"`);
  return (await res.json()) as SampleRun;
}
