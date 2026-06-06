/**
 * Cloudflare Worker — self-hosted page-view counter backed by KV.
 *
 * Responds to GET requests with JSON:
 *   { page_pv, site_pv, site_uv }
 *
 * Query params:
 *   path     - the page path to count (e.g. "/2026/02/01/check/"), required
 *   visitor  - opaque per-browser id (stored client-side), optional; used for
 *              unique-visitor counting only
 *
 * Requires a KV namespace bound as COUNTER (see wrangler.toml).
 *
 * Notes:
 *  - KV is eventually consistent, so under heavy concurrent traffic a few
 *    increments may be lost. Fine for a personal blog. If you ever need exact
 *    atomic counts, switch the storage to a Durable Object.
 *  - Free-tier KV allows ~1,000 writes/day. Each page view does ~2 writes
 *    (page_pv + site_pv), so this comfortably handles a few hundred views/day.
 */

// Only these deployed origins may record page views.
const SITE_ORIGINS = [
  'https://keruiwublog.github.io',
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);
    const isLocalDebug = isLocalOrigin(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== 'GET') {
      return json({ error: 'method not allowed' }, 405, cors);
    }
    if (!env.COUNTER) {
      return json({ error: 'KV namespace COUNTER is not bound' }, 500, cors);
    }

    const url = new URL(request.url);

    // --- peek mode: read counts for many paths WITHOUT incrementing ---------
    // Used by list pages (home/archive) to display each post's views.
    // GET ...?peek=1&paths=/a/,/b/  ->  { counts: { "/a/": 12, "/b/": 3 } }
    if (url.searchParams.get('peek')) {
      const rawPaths = (url.searchParams.get('paths') || '')
        .split(',')
        .map(function (s) { return s.trim(); })
        .filter(Boolean)
        .slice(0, 100);
      const entries = await Promise.all(
        rawPaths.map(async function (raw) {
          const v = parseInt(await env.COUNTER.get('pv:' + normalisePath(raw)), 10) || 0;
          return [raw, v]; // key by the original string so the client can match it
        })
      );
      const counts = {};
      entries.forEach(function (e) { counts[e[0]] = e[1]; });
      return json({ counts: counts }, 200, cors);
    }

    const rawPath = url.searchParams.get('path');
    const visitor = (url.searchParams.get('visitor') || '').slice(0, 64);

    if (!rawPath) {
      return json({ error: 'missing path' }, 400, cors);
    }
    // Normalise so "/foo" and "/foo/" count as the same page.
    const path = normalisePath(rawPath);

    if (isLocalDebug) {
      return json(await readCounts(env, path), 200, cors);
    }

    // --- page views -------------------------------------------------------
    const pageKey = 'pv:' + path;
    const pagePv = (parseInt(await env.COUNTER.get(pageKey), 10) || 0) + 1;
    await env.COUNTER.put(pageKey, String(pagePv));

    // --- site-wide views --------------------------------------------------
    const sitePv = (parseInt(await env.COUNTER.get('site:pv'), 10) || 0) + 1;
    await env.COUNTER.put('site:pv', String(sitePv));

    // --- unique visitors --------------------------------------------------
    let siteUv = parseInt(await env.COUNTER.get('site:uv'), 10) || 0;
    if (visitor) {
      const uvKey = 'uv:' + visitor;
      const seen = await env.COUNTER.get(uvKey);
      if (!seen) {
        siteUv += 1;
        await env.COUNTER.put('site:uv', String(siteUv));
        // Remember this visitor for a year so they only count once.
        await env.COUNTER.put(uvKey, '1', { expirationTtl: 60 * 60 * 24 * 365 });
      }
    }

    return json({ page_pv: pagePv, site_pv: sitePv, site_uv: siteUv }, 200, cors);
  },
};

async function readCounts(env, path) {
  const pagePv = parseInt(await env.COUNTER.get('pv:' + path), 10) || 0;
  const sitePv = parseInt(await env.COUNTER.get('site:pv'), 10) || 0;
  const siteUv = parseInt(await env.COUNTER.get('site:uv'), 10) || 0;
  return { page_pv: pagePv, site_pv: sitePv, site_uv: siteUv };
}

function normalisePath(p) {
  try {
    p = decodeURIComponent(p);
  } catch (e) {
    // keep raw value if it is not valid encoding
  }
  if (!p.startsWith('/')) p = '/' + p;
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p.slice(0, 512);
}

function corsHeaders(origin) {
  const allow = SITE_ORIGINS.includes(origin) || isLocalOrigin(origin) ? origin : SITE_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

function isLocalOrigin(origin) {
  if (!origin) return false;
  try {
    const host = new URL(origin).hostname;
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
  } catch (e) {
    return false;
  }
}

function json(body, status, headers) {
  return new Response(JSON.stringify(body), {
    status,
    headers: Object.assign(
      { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      headers || {}
    ),
  });
}
