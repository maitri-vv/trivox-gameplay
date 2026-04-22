const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store'
};

function compareMainEntries(a, b) {
  if ((b.pairs ?? 0) !== (a.pairs ?? 0)) return (b.pairs ?? 0) - (a.pairs ?? 0);

  const sameMode = a.modeKey === b.modeKey;
  if (sameMode) {
    if (a.modeKey === 'two-player') {
      if ((a.flips ?? 999) !== (b.flips ?? 999)) return (a.flips ?? 999) - (b.flips ?? 999);
      return (a.seconds ?? 9999) - (b.seconds ?? 9999);
    }
    if (a.modeKey === 'time-attack') {
      if ((a.seconds ?? 9999) !== (b.seconds ?? 9999)) return (a.seconds ?? 9999) - (b.seconds ?? 9999);
      return (a.flips ?? 999) - (b.flips ?? 999);
    }
    if ((a.seconds ?? 9999) !== (b.seconds ?? 9999)) return (a.seconds ?? 9999) - (b.seconds ?? 9999);
    return (a.flips ?? 999) - (b.flips ?? 999);
  }

  if (a.modeKey === 'two-player' || b.modeKey === 'two-player') {
    if ((b.pairs ?? 0) !== (a.pairs ?? 0)) return (b.pairs ?? 0) - (a.pairs ?? 0);
    if ((a.flips ?? 999) !== (b.flips ?? 999)) return (a.flips ?? 999) - (b.flips ?? 999);
    return (a.seconds ?? 9999) - (b.seconds ?? 9999);
  }

  if ((a.seconds ?? 9999) !== (b.seconds ?? 9999)) return (a.seconds ?? 9999) - (b.seconds ?? 9999);
  return (a.flips ?? 999) - (b.flips ?? 999);
}

function sanitizeEntry(body) {
  const candidate = {
    id: String(body?.id || '').trim(),
    modeKey: String(body?.modeKey || '').trim(),
    name: String(body?.name || '').trim(),
    mode: String(body?.mode || '').trim(),
    date: String(body?.date || '').trim(),
    seconds: Number(body?.seconds),
    flips: Number(body?.flips),
    pairs: Number(body?.pairs),
    opponent: body?.opponent == null ? null : String(body.opponent).trim(),
    extra: body?.extra == null ? '' : String(body.extra).trim(),
  };

  const validModes = new Set(['classic', 'time-attack', 'vs-ai', 'two-player']);
  if (!candidate.id || !validModes.has(candidate.modeKey)) throw new Error('Invalid score id or mode.');
  if (!candidate.name) throw new Error('Winner name is required.');
  if (!candidate.mode) throw new Error('Mode label is required.');
  if (!Number.isFinite(candidate.seconds) || candidate.seconds < 0) throw new Error('Seconds must be a non-negative number.');
  if (!Number.isFinite(candidate.flips) || candidate.flips < 0) throw new Error('Flips must be a non-negative number.');
  if (!Number.isFinite(candidate.pairs) || candidate.pairs < 0) throw new Error('Pairs must be a non-negative number.');

  candidate.seconds = Math.round(candidate.seconds);
  candidate.flips = Math.round(candidate.flips);
  candidate.pairs = Math.round(candidate.pairs);
  candidate.date = candidate.date || new Date().toLocaleDateString('en-US');
  return candidate;
}

async function fetchTopEntries(env) {
  const { results } = await env.TRIVOX_DB.prepare(`
    SELECT id, mode_key, name, mode, date_text, seconds, flips, pairs, opponent, extra, created_at
    FROM scores
    ORDER BY created_at DESC
    LIMIT 1000
  `).all();

  const entries = (results || []).map((row) => ({
    id: row.id,
    modeKey: row.mode_key,
    name: row.name,
    mode: row.mode,
    date: row.date_text,
    seconds: Number(row.seconds || 0),
    flips: Number(row.flips || 0),
    pairs: Number(row.pairs || 0),
    opponent: row.opponent || null,
    extra: row.extra || '',
    createdAt: Number(row.created_at || 0),
  }));

  return entries.sort(compareMainEntries).slice(0, 10);
}

function json(data, init = {}) {
  return new Response(JSON.stringify(data), {
    status: init.status || 200,
    headers: { ...jsonHeaders, ...(init.headers || {}) },
  });
}

export { compareMainEntries, sanitizeEntry, fetchTopEntries, json };
