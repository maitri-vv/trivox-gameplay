import { sanitizeEntry, fetchTopEntries, json } from './_shared.js';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const entry = sanitizeEntry(body);

    await context.env.TRIVOX_DB.prepare(`
      INSERT OR REPLACE INTO scores (id, mode_key, name, mode, date_text, seconds, flips, pairs, opponent, extra, created_at)
      VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
    `).bind(
      entry.id,
      entry.modeKey,
      entry.name,
      entry.mode,
      entry.date,
      entry.seconds,
      entry.flips,
      entry.pairs,
      entry.opponent,
      entry.extra,
      Date.now()
    ).run();

    const entries = await fetchTopEntries(context.env);
    return json({ ok: true, entries });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }, { status: 400 });
  }
}
