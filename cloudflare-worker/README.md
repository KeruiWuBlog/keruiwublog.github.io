# Blog page-view counter (Cloudflare Worker + KV)

A tiny, self-hosted, free counter for the blog. The Worker stores per-page and
site-wide view counts in a KV namespace and returns them as JSON; the theme's
front-end script ([`themes/YoruKumo/source/js/counter.js`](../themes/YoruKumo/source/js/counter.js))
calls it on each page load and fills in the numbers.

## One-time setup

From this `cloudflare-worker/` directory:

```bash
npm install

# 1. Log in to your Cloudflare account
npx wrangler login

# 2. Create the KV namespace and copy the printed id into wrangler.toml
npx wrangler kv namespace create COUNTER

# 3. Edit wrangler.toml: paste the id into `id = "..."`

# 4. Deploy
npx wrangler deploy
```

`wrangler deploy` prints your Worker URL, e.g.:

```
https://blog-counter.<your-subdomain>.workers.dev
```

## Wire it up to the blog

1. Put that URL into the theme config
   [`themes/YoruKumo/_config.yml`](../themes/YoruKumo/_config.yml) under
   `counter.endpoint`.
2. Make sure your real site origin is listed in `SITE_ORIGINS` at the top of
   [`src/index.js`](src/index.js) (it already includes the GitHub Pages URL).
   Localhost origins can read counts while debugging, but they do not record
   page views. Re-run `npx wrangler deploy` after editing.

## Notes

- **Free limits.** KV free tier allows ~1,000 writes/day. Each page view does
  about 2 writes, so this handles a few hundred views/day comfortably.
- **Consistency.** KV is eventually consistent; under heavy simultaneous traffic
  a few counts may be lost. For a personal blog this is fine. For exact atomic
  counts, migrate the storage to a Durable Object.
- **Reset / inspect counts:**
  ```bash
  npx wrangler kv key list   --binding COUNTER
  npx wrangler kv key get    --binding COUNTER "site:pv"
  npx wrangler kv key put    --binding COUNTER "site:pv" "0"
  ```
