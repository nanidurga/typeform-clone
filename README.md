# Formly — a Typeform Clone

A functional clone of Typeform: build conversational forms with a drag-and-drop
builder, publish them via a shareable link, collect responses through the
signature one-question-at-a-time experience, and explore results with
per-question summary stats.

Built for the **SDE Fullstack Assignment**.

**Bonus features implemented:** welcome screens, custom themes (accent color,
background, font), and CSV export of responses.

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Next.js 16 (App Router), TypeScript (strict), Tailwind CSS 4, TanStack Query, framer-motion, @dnd-kit, sonner |
| Backend   | Python, FastAPI, SQLAlchemy 2, Pydantic v2 |
| Database  | SQLite |
| Hosting   | Vercel (frontend) + Railway (backend, persistent volume) |

## Repository layout

```
frontend/   Next.js app (dashboard, builder, respondent flow, results)
backend/    FastAPI app (REST API, validation, seed data, tests)
            └─ railway.toml — Railway service config (build & start command)
```

## Running locally

**Backend** (Python 3.11+):

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows — use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

On first start the app creates `backend/data/app.db` and seeds it with two
published demo forms (with responses) and one draft. On upgrades, a small
startup migration adds any new columns to existing SQLite databases
(`create_all` only creates missing tables).

**Frontend** (Node 20+):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The frontend reads `NEXT_PUBLIC_API_URL`
(defaults to `http://localhost:8000`).

**Backend tests:**

```bash
cd backend
.venv/Scripts/python -m pytest
```

34 tests cover form CRUD, question management and reordering, public
submission with every validation rule, results/summary stats, and seeding.

## Architecture overview

```
┌──────────────────────┐         HTTPS (JSON)         ┌─────────────────────┐
│  Next.js on Vercel   │  ──────────────────────────▶ │ FastAPI on Railway  │
│  (client components) │   fetch via NEXT_PUBLIC_API  │  CORS-restricted    │
└──────────────────────┘                              └──────────┬──────────┘
   dashboard  /                                                  │ SQLAlchemy
   builder    /forms/[id]/edit                        ┌──────────▼──────────┐
   results    /forms/[id]/results                     │  SQLite on volume   │
   fill       /f/[publicId]   (public, no auth)       │  (seeded if empty)  │
└─────────────────────────────────────────────────────┴─────────────────────┘
```

- The browser talks **directly** to the FastAPI API; there is no Next.js
  API-route proxy. The two interactive centerpieces (drag-and-drop builder,
  animated one-at-a-time respondent flow) are client components.
- The builder keeps a local working copy of the form and **autosaves** with a
  500 ms debounce through granular question endpoints; drag-and-drop order is
  persisted through a dedicated reorder endpoint.
- Answers are validated **twice**: inline in the respondent flow for instant
  feedback, and authoritatively on the server (mirrored rules) before a
  response is stored.

## Database schema

```
forms
  id                 INTEGER PK
  title              TEXT NOT NULL
  status             TEXT      -- 'draft' | 'published'
  public_id          TEXT UNIQUE  -- random slug used in the share link /f/{public_id}
  thank_you_message  TEXT NULL
  welcome_enabled    BOOLEAN      -- show a welcome screen before the first question
  welcome_title      TEXT NULL    -- falls back to the form title
  welcome_message    TEXT NULL
  theme              JSON NULL    -- {"accent","background","font"} preset keys
  created_at, updated_at DATETIME

questions
  id           INTEGER PK
  form_id      FK → forms.id (CASCADE delete)
  type         TEXT  -- short_text | long_text | multiple_choice | dropdown
               --     | email | number | yes_no | rating
  title        TEXT
  description  TEXT NULL          -- help text
  required     BOOLEAN
  position     INTEGER            -- order within the form
  settings     JSON NULL          -- type-specific config (e.g. {"max": 10} for rating)

question_options                  -- rows for multiple_choice / dropdown choices
  id           INTEGER PK
  question_id  FK → questions.id (CASCADE)
  label        TEXT
  position     INTEGER

responses
  id           INTEGER PK
  form_id      FK → forms.id (CASCADE)
  submitted_at DATETIME

answers
  id           INTEGER PK
  response_id  FK → responses.id (CASCADE)
  question_id  FK → questions.id (CASCADE)
  value        TEXT               -- normalized string ("Yes"/"No", option label, "4", …)
```

Choice options live in a normalized `question_options` table (proper
relationships, reorderable, referenced by validation), while the small
`settings` JSON column absorbs per-type configuration without schema sprawl.

## API overview

All endpoints are JSON under `/api`. Interactive docs at `/docs` (Swagger).

### Creator endpoints (no auth — single implicit creator)

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/api/forms` | List forms with status, question & response counts |
| POST   | `/api/forms` | Create a form `{title}` |
| GET    | `/api/forms/{id}` | Full form with questions and options |
| PATCH  | `/api/forms/{id}` | Rename, publish/unpublish, thank-you message |
| DELETE | `/api/forms/{id}` | Delete form (cascades) |
| POST   | `/api/forms/{id}/duplicate` | Duplicate form + questions (draft copy) |
| POST   | `/api/forms/{id}/questions` | Add a question |
| PATCH  | `/api/questions/{id}` | Edit question fields / replace options |
| DELETE | `/api/questions/{id}` | Delete question (positions compacted) |
| PUT    | `/api/forms/{id}/questions/order` | Persist drag-and-drop order |
| GET    | `/api/forms/{id}/responses` | Responses list |
| GET    | `/api/forms/{id}/responses/export` | Download all responses as CSV |
| GET    | `/api/responses/{id}` | One response with question titles |
| GET    | `/api/forms/{id}/summary` | Per-question stats (counts, averages, distributions) |

### Public endpoints (published forms only)

| Method | Path | Purpose |
|--------|------|---------|
| GET    | `/api/public/forms/{public_id}` | Form definition for the fill experience |
| POST   | `/api/public/forms/{public_id}/responses` | Submit answers; 422 with per-question errors on validation failure |

Server-side validation rules: required, email format, numeric values, rating
range (1..max), option membership for choice/dropdown, Yes/No for yes-no.

## Deployment

**Backend → Railway:**

1. Push the repo to GitHub.
2. In Railway: *New Project → Deploy from GitHub repo*, pick the repo.
3. In the service **Settings → Source**, set **Root Directory** to `backend`
   (Railway then picks up `backend/railway.toml` for the start command).
4. Attach a **Volume** to the service with mount path `/app/data`
   (right-click the service → *Attach Volume*). This makes the SQLite file
   survive redeploys and restarts.
5. In **Variables**, add:
   - `DATABASE_URL` = `sqlite:////app/data/app.db`  (absolute path into the volume)
   - `CORS_ORIGINS` = `http://localhost:3000` for now — after the frontend is
     deployed, change it to `https://your-app.vercel.app,http://localhost:3000`
6. In **Settings → Networking**, click *Generate Domain* to get the public
   API URL (e.g. `https://typeform-clone-api.up.railway.app`). Verify
   `https://<your-domain>/api/health` returns `{"status":"ok"}`.

**Frontend → Vercel:**

1. In Vercel: *Add New → Project*, import the repo.
2. Set **Root Directory** to `frontend/`.
3. Add env var `NEXT_PUBLIC_API_URL` = your Railway URL
   (e.g. `https://typeform-clone-api.up.railway.app`).
4. Deploy, then go back to Railway and update `CORS_ORIGINS` with the
   Vercel URL.

## Assumptions & notes

- **Auth is intentionally simplified** per the assignment: the app assumes a
  single default logged-in creator. Public form filling needs no account.
- **SQLite persistence:** on Railway the database lives on a mounted volume,
  so data survives redeploys and restarts. The app also re-seeds demo data
  automatically whenever the database is empty (first boot, or any host
  without a persistent disk), so the demo is always usable.
- **Question type is immutable** after creation — delete and re-add to change
  a question's type (matches the API's granular design; the builder offers
  duplicate/delete to make this easy).
- **Placeholders (per assignment):** logic jumps/branching, integrations,
  collaboration, and the file-upload question type are shown as "Coming soon".
- **Themes** are preset-based (6 accents × 5 backgrounds × 3 fonts) rather than
  free-form pickers. The respondent UI reads every color from CSS variables, so
  a single themed wrapper re-skins the whole flow — and the builder's live
  preview reuses the same components, so it can't drift from the real thing.
- Railway hobby services may sleep when idle (if Serverless/App Sleeping is
  enabled); the first request after a quiet period can take a few seconds.
