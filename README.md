# DIBS

**My closet, temporarily available to the public.**

A private, shareable digital closet. Friends open a link, browse the pieces you're
parting with, and **call dibs** on what they want — **GIFT** (free) or **SELL**
(priced, with an offer flow). No group chat, no app, no accounts.

Built as a portfolio piece: product thinking, creative direction, UX/UI, a real
AI integration, and Claude Code. Art direction implemented from a Claude Design
board (`DIBS.dc.html`) — *"visual chaos, perfect UX."*

---

## Run it

```bash
npm install
cp .env.example .env.local   # edit values (see below)
npm run dev                  # http://localhost:3000
```

First run creates `data/db.json` from the seed wardrobe (14 pieces, 5 looks).

| Route | What |
|---|---|
| `/` | Landing |
| `/closet/the-closet` | The gallery — filter gifts / for-sale / category, sort |
| `/closet/the-closet/item/<slug>` | A piece — details + call dibs / make an offer |
| `/closet/the-closet/looks` | Lookbook |
| `/closet/the-closet/dibs` | Who's claimed what + offers on the table |
| `/admin` | Owner dashboard (password below) |

## Environment (`.env.local`)

| Key | Purpose |
|---|---|
| `DIBS_ADMIN_PASSWORD` | Password for `/admin`. Example ships as `letmein`. |
| `ANTHROPIC_API_KEY` | Optional. Turns on AI cataloguing. **Without it the AI button says so plainly — nothing is faked.** |
| `DIBS_AI_MODEL` | Model for cataloguing. Default `claude-sonnet-5`. |

---

## Adding your own clothes

### Through the app (normal way)

1. `/admin` → sign in with `DIBS_ADMIN_PASSWORD`.
2. **+ add a piece** → upload one clear photo.
3. If `ANTHROPIC_API_KEY` is set: **Ask AI** drafts the name, category, colour,
   condition, tags, a description in the owner's voice, and a suggested resale
   **range** (SELL only). You review and edit **every field** before publishing.
   The price is always labelled an estimate, never a valuation.
4. No key: fill the form by hand. The photo still uploads.

Uploaded photos are written to `public/uploads/`.

### Editing the demo wardrobe (seed)

1. Drop image files into `public/seed/`.
2. Reference them in [`src/lib/db/seed.ts`](src/lib/db/seed.ts) — each photo needs
   `filename`, pixel `width`, `height`, and `alt` text.
3. Delete `data/db.json` and reload — it re-seeds from the file.

## The data store

Everything lives in **one JSON file: `data/db.json`** (git-ignored, created from
the seed on first run). All reads/writes go through the repository layer in
[`src/lib/repo.ts`](src/lib/repo.ts) — pages and actions never touch the store
directly.

- **Reset:** delete `data/db.json`.
- **Inspect:** open the file, it's plain JSON.

### Deploying

Both `store.ts` and `storage.ts` are **dual-mode**, chosen by env var:

| env | store | images |
|---|---|---|
| none | `data/db.json` | `public/uploads/` |
| `DATABASE_URL` / `POSTGRES_URL` | Postgres (Neon), one JSON row + optimistic locking | — |
| `BLOB_READ_WRITE_TOKEN` | — | Vercel Blob |

Live at **https://dibs-beige.vercel.app** (Vercel + Neon Postgres + Vercel Blob,
all free tier). Full setup and re-deploy steps in [DEPLOY.md](DEPLOY.md).

---

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
`@anthropic-ai/sdk` (vision cataloguing) · `motion` · `zod` · JSON file store.

## Design system

Tokens and rules in [`src/app/globals.css`](src/app/globals.css); collage
primitives in [`src/components/collage/`](src/components/collage/).

- **Type:** Anton (display) · Instrument Serif (editorial voice) · Space Grotesk
  (UI) · Caveat (margin notes).
- **State is always a coloured *label*, never a colour alone:** AVAILABLE =
  acid green, DIBSED ♡ = hot pink, FOR SALE = cobalt, GONE = tomato.
- **Chrome stays black and fixed. Only decoration rotates — never text you must
  read.** Stickers (stars, scrawls, tape) are a toggle.

## Verify the flow

```
landing → closet → filter → open a gift → call dibs (stamp slams, confetti)
        → open a SELL piece → make an offer
        → /admin → see the claim + offer, accept it, mark something SOLD
        → + add a piece → (with a key) AI draft → edit → publish
        → /closet/the-closet/dibs → the claim shows up
```

Reset anytime: `rm data/db.json`.
