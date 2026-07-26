# Formly — a Typeform Clone

A functional clone of Typeform: build conversational forms with a drag-and-drop
builder, publish them via a shareable link, collect responses through the
signature one-question-at-a-time experience, and explore results with
per-question summary stats.

Built for the **SDE Fullstack Assignment**.

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Next.js 16 (App Router), TypeScript (strict), Tailwind CSS 4, TanStack Query, framer-motion, @dnd-kit, sonner |
| Backend   | Python, FastAPI, SQLAlchemy 2, Pydantic v2 |
| Database  | SQLite |
| Hosting   | Vercel (frontend) + Render (backend) |

## Repository layout

```
frontend/   Next.js app (dashboard, builder, respondent flow, results)
backend/    FastAPI app (REST API, validation, seed data, tests)
render.yaml Render blueprint for the backend
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
published demo forms (with responses) and one draft.

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
│  Next.js on Vercel   │  ──────────────────────────▶ │  FastAPI on Render  │
│  (client components) │   fetch via NEXT_PUBLIC_API  │  CORS-restricted    │
└──────────────────────┘                              └──────────┬──────────┘
   dashboard  /                                                  │ SQLAlchemy
   builder    /forms/[id]/edit                        ┌──────────▼──────────┐
   results    /forms/[id]/results                     │       SQLite        │
   fill       /f/[publicId]   (public, no auth)       │  (seeded on boot)   │
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

**Backend → Render** (free tier):

1. Push the repo to GitHub.
2. In Render: *New → Blueprint*, pick the repo — it reads `render.yaml`.
3. After the first deploy, set `CORS_ORIGINS` to your Vercel URL
   (e.g. `https://your-app.vercel.app,http://localhost:3000`).

**Frontend → Vercel:**

1. In Vercel: *Add New → Project*, import the repo.
2. Set **Root Directory** to `frontend/`.
3. Add env var `NEXT_PUBLIC_API_URL` = your Render URL
   (e.g. `https://typeform-clone-api.onrender.com`).

## Assumptions & notes

- **Auth is intentionally simplified** per the assignment: the app assumes a
  single default logged-in creator. Public form filling needs no account.
- **Ephemeral disk on Render's free tier:** the SQLite file is recreated on
  redeploys/restarts. The app re-seeds demo data automatically whenever the
  database is empty, so the hosted demo is always usable. (A persistent disk
  or hosted DB would be the production fix.)
- **Question type is immutable** after creation — delete and re-add to change
  a question's type (matches the API's granular design; the builder offers
  duplicate/delete to make this easy).
- **Placeholders (per assignment):** logic jumps/branching, integrations,
  collaboration, theme customization, and the file-upload question type are
  shown as "Coming soon".
- Free-tier Render services cold-start after ~15 min idle; the first request
  may take up to a minute.
