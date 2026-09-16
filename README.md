# Family Circle

A private social platform for families. Anyone can create an account, start a
family group (or join one with an invite code), and share photos and updates
that only that family's members can see. Multiple families can use the same
app, each fully separate from the others.

## Features

- Username/password accounts (passwords hashed with bcrypt)
- Create a family group → get a private invite code
- Join a family group with someone else's invite code
- Photo + caption posts in each family's private feed
- Photos stored in Vercel Blob, everything else in Postgres

## Tech stack

- Next.js 14 (App Router)
- Vercel Postgres (via `@vercel/postgres`)
- Vercel Blob (via `@vercel/blob`) for photo storage
- JWT session cookie (via `jsonwebtoken`)

## Deploying (GitHub → Vercel)

1. **Push this repo to GitHub** (see steps in chat — repo name suggested:
   `family-circle`).

2. **Import the repo into Vercel**: on vercel.com, "Add New… → Project",
   select the GitHub repo, and deploy. The first deploy will succeed even
   without a database — you just won't be able to sign up yet.

3. **Add a Postgres database**: in the Vercel project → **Storage** tab →
   **Create Database → Postgres** (this provisions a Neon-backed Postgres
   database and automatically adds the connection env vars —
   `POSTGRES_URL`, etc. — to your project).

4. **Add Blob storage**: same **Storage** tab → **Create Database → Blob**.
   This adds a `BLOB_READ_WRITE_TOKEN` env var automatically.

5. **Set the session secret**: in the project's **Settings → Environment
   Variables**, add:
   - `SESSION_SECRET` — any long random string (e.g. generate one with
     `openssl rand -hex 32` in a terminal).

6. **Redeploy** the project (Deployments tab → ⋯ → Redeploy) so it picks up
   the new environment variables.

7. **Verify the database**: visit `https://<your-app>.vercel.app/api/init`
   once. You should see `{"ok":true,"message":"Database connected and
   tables are ready."}`. The tables are also created automatically the
   first time anyone signs up, so this step is just a quick sanity check.

8. Visit your site, create an account, create a family, and share the
   invite code with the people you want in it.

## Local development

You generally don't need to run this locally — editing happens here in
chat and deploys go through Vercel. If you do want to run it locally:

```bash
npm install
vercel env pull .env.local   # pulls your Postgres/Blob/session env vars
npm run dev
```

## Notes

- Each family's photos and posts are only visible to people who are members
  of that family (checked on every request, not just hidden in the UI).
- Invite codes are 7-character codes (e.g. `A7K2Q9X`) and never expire.
  If you want to rotate one, delete and recreate the family for now — code
  rotation can be added later.
