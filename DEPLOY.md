# Making DIBS live (Vercel — free)

DIBS runs on two backends. Locally it uses a JSON file + a local folder for
photos. In production it switches automatically:

| Env var present | Store | Photos |
|---|---|---|
| `DATABASE_URL` (or `POSTGRES_URL`) | Postgres (Neon) | — |
| `BLOB_READ_WRITE_TOKEN` | — | Vercel Blob |

Nothing in the app code changes — you just add those on Vercel.

Your starting closet (the 8 pieces + intro) lives in **`data/initial.json`** and
is loaded into the database the first time the deployed app boots.

---

## 1. Deploy the code

From the `dibs/` folder:

```bash
npx vercel
```

- It opens a browser to log in (make a free Vercel account if you don't have one).
- Answer the prompts: **Set up and deploy** → yes, pick your scope, **link to
  existing project?** no, accept the default name, **directory** `.`, keep the
  detected settings.
- It builds and gives you a URL like `https://dibs-xxxx.vercel.app`. The closet
  won't fully work yet — it has no database. Next step fixes that.

## 2. Add the database (Neon Postgres, free)

1. Go to **vercel.com → your project → Storage → Create Database**.
2. Choose **Postgres** (it's Neon underneath), region close to you, **Free** plan.
3. **Connect** it to this project. Vercel adds `DATABASE_URL` / `POSTGRES_URL`
   env vars automatically.

## 3. Add photo storage (Vercel Blob, free)

1. **Storage → Create** → **Blob**.
2. **Connect** it to this project. Vercel adds `BLOB_READ_WRITE_TOKEN`.

## 4. Set the remaining env vars

**Project → Settings → Environment Variables**, add for *Production*:

| Name | Value |
|---|---|
| `DIBS_ADMIN_PASSWORD` | **pick a real password** (not `letmein`) — this guards `/admin` |
| `NEXT_PUBLIC_SITE_URL` | your Vercel URL, e.g. `https://dibs-xxxx.vercel.app` |
| `ANTHROPIC_API_KEY` | *(optional)* your key, to enable AI cataloguing |
| `DIBS_AI_MODEL` | *(optional)* `claude-sonnet-5` |

## 5. Redeploy

**Deployments → ⋯ on the latest → Redeploy** (or `npx vercel --prod`).

On this boot the app creates its table and loads `data/initial.json`. Open the
URL — your 8 pieces should be there. Share the link. Friends can call dibs; it's
all saved in Postgres now.

---

## After it's live

- **Add pieces**: `/admin` → your password → **+ add a piece**. Photos upload to
  Blob, data to Postgres.
- **Change closet name / intro** later: edit `data/initial.json`, then in `/admin`
  the reset control (or `POST /api/dev/reset` while signed in) reloads it —
  **note this wipes any pieces added through admin since**, so do renames before
  you start adding real pieces, or edit directly in Postgres.
- **Custom domain**: Project → Settings → Domains.
- **Costs**: Vercel Hobby, Neon Free (0.5 GB), Blob Free (1 GB) — all $0 for a
  personal closet. AI cataloguing bills to your Anthropic account (~1–2¢/photo).

## Redeploying after code changes

```bash
git add -A && git commit -m "…"
npx vercel --prod
```

(or connect the project to a GitHub repo in Vercel for auto-deploy on push).
