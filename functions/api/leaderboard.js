import { fetchTopEntries, json } from './_shared.js';

export async function onRequestGet(context) {
  const entries = await fetchTopEntries(context.env);
  return json({ entries });
}
