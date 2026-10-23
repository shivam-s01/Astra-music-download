# Astra Jam server (Cloudflare Worker + Durable Objects)

Alag Worker hai — tumhari site (astra) ko touch nahi karta.

## Deploy (2 commands, PC/Termux/Codespaces kahin bhi)
```
cd jam-server
npx wrangler login        # ek baar, browser me Cloudflare allow
npx wrangler deploy
```
Deploy ke baad URL aayega: `https://astra-jam.<subdomain>.workers.dev`
Tumhara subdomain `mmusic` hai to: `wss://astra-jam.mmusic.workers.dev/jam/ws`
(app me ye default set hai. Alag aaye to Jam → Settings → Server me daal do.)

Check: browser me URL kholo -> "Astra Jam server OK".
Test: `npm test` (22 checks, room logic).

Free plan chalega (SQLite Durable Objects). Koi secret/key nahi chahiye.

## Phone se (GitHub Actions)
Repo me `.github/workflows/deploy-jam.yml` hai. Repo Settings → Secrets → Actions me 2 secret daalo:
- `CLOUDFLARE_API_TOKEN` (Cloudflare → My Profile → API Tokens → template "Edit Cloudflare Workers")
- `CLOUDFLARE_ACCOUNT_ID`
Phir push karo (ya Actions tab me "Deploy Jam server" → Run workflow) — deploy ho jayega.
