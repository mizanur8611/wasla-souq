# Wasla Souq — Setup Guide (Start to Finish)

Follow these steps in exact order. Don't skip ahead — each step depends on the one before it.

---

## STEP 1 — Create the Render database

1. Go to **render.com** and sign in (sign up with GitHub if you haven't already).
2. Click **"+ New"** (top right) → select **"PostgreSQL"**.
3. Fill in:
   - **Name**: `wasla-souq-db`
   - **Region**: any region close to you (e.g. Virginia, Singapore)
   - **Plan**: **Free**
4. Click **"Create Database"**. Wait ~1 minute until status shows **"Available"**.
5. On the database's page, find the **"Connections"** section.
6. Copy the **"External Database URL"**. It looks like:
   ```
   postgresql://wasla_souq_db_user:somePassword@some-host.render.com/wasla_souq_db
   ```

**Stop here and make sure you have this URL copied before continuing.**

---

## STEP 2 — Put the URL into your project

1. Open the `wasla-web` folder you extracted.
2. Open the `.env` file in a text editor (Notepad is fine).
3. Replace the placeholder line with your real URL, so it looks like:
   ```
   DATABASE_URL="postgresql://wasla_souq_db_user:somePassword@some-host.render.com/wasla_souq_db"
   DATABASE_SSL=true
   ```
4. Save the file.

**Important:** keep the quotation marks `"..."` around the URL. Keep `DATABASE_SSL=true` exactly as is — Render requires this.

---

## STEP 3 — Install and run, on your PC

Open Command Prompt and run these one at a time:

```bash
cd D:\project-4\wasla-web
npm install
npm run db:seed
npm run dev
```

- `npm install` downloads the project's dependencies (~1 minute).
- `npm run db:seed` creates the database tables on Render and loads 4 demo restaurants.
  You should see: `Seeded city: Dubai, 4 partners, demo customer: sara@example.com`
- `npm run dev` starts the website.

Open your browser to **http://localhost:3000** — you should see the Wasla Souq homepage with restaurants listed.

**If `npm run db:seed` shows an error** (something like `password authentication failed` or `ECONNREFUSED`):
- Double-check the URL in `.env` was copied completely and correctly (no missing characters, no extra spaces).
- Make sure the Render database status is "Available", not "Creating".

---

## STEP 4 — Push to GitHub

Only do this once Step 3 works without errors.

```bash
cd D:\project-4\wasla-web
git init
git add .
git commit -m "Wasla Souq Phase 0"
```

Then on **github.com**:
1. Click **"+"** (top right) → **"New repository"**.
2. Name it `wasla-souq-web`. Keep it **Private** if you prefer. Don't add a README (you already have one).
3. Click **"Create repository"**.
4. Copy the commands GitHub shows under **"…or push an existing repository"** — they'll look like:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/wasla-souq-web.git
   git branch -M main
   git push -u origin main
   ```
5. Run those commands in your Command Prompt.

---

## STEP 5 — Deploy to Vercel

1. Go to **vercel.com**, sign in with GitHub.
2. Click **"Add New..." → "Project"**.
3. Find and **Import** your `wasla-souq-web` repository.
4. Before clicking Deploy, open **"Environment Variables"** and add:
   - `DATABASE_URL` = (the same Render External Database URL from Step 1)
   - `DATABASE_SSL` = `true`
5. Click **"Deploy"**.

After 1-2 minutes, Vercel gives you a live URL like `wasla-souq-web.vercel.app` — that's your live site.

---

## Phase 1 — Restaurant Panel & Admin Panel (new)

Running `npm run db:seed` now also creates two login accounts so you can test the new panels immediately:

| Panel | URL | Email | Password |
|---|---|---|---|
| Restaurant Panel | `/restaurant-panel/login` | `owner@manqal.com` | `password123` |
| Admin Panel | `/admin-panel/login` | `admin@waslasouq.com` | `admin123` |

**To test the full order flow end to end:**
1. Place an order as a customer on the homepage (`/`), same as before.
2. Log into the Restaurant Panel — the new order appears under "New orders." Click **Accept** (or **Reject**).
3. After accepting, click **Start preparing**, then **Mark ready for pickup** — the order moves through each stage.
4. Open the order's tracking page as the customer (`/order/[id]`) — the status steps now reflect what the restaurant actually did, not a fixed demo animation like before.
5. Log into the Admin Panel — every order across every restaurant is visible in one live list, with counts at the top.

Rider assignment is intentionally not automatic anymore — a real rider app is the next Phase 1 piece (see the Full Platform Specification document), so orders now sit at "ready_for_pickup" with no rider until that's built.

---

## Quick troubleshooting reference

| Problem | Fix |
|---|---|
| `password authentication failed` / code `28P01` | The `DATABASE_URL` in `.env` is wrong or incomplete — recopy it from Render's "Connections" tab |
| `ECONNREFUSED` | Render database isn't "Available" yet, or the URL host is wrong |
| `npm run dev` works but homepage shows no restaurants | Run `npm run db:seed` again |
| Vercel deploy fails | Check that both `DATABASE_URL` and `DATABASE_SSL=true` are set in Vercel's Environment Variables, not just locally |
