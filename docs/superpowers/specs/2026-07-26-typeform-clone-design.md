# Typeform Clone — Design Spec

**Date:** 2026-07-26
**Source:** "Assignment Typeform Clone.docx" (SDE Fullstack Assignment)
**Scope:** All core features. Bonus section explicitly excluded (no logic jumps, custom themes, CSV export, partial-response tracking, file upload, dark mode).

## Goal

A functional Typeform clone: a creator builds forms with a drag-and-drop builder, publishes them via a shareable link, respondents fill them through the one-question-at-a-time conversational flow (no auth), and the creator views responses and summary stats. Must visually and functionally feel like Typeform.

## Decisions made during brainstorming

- **Stack (assignment-mandated):** Next.js (TypeScript) frontend, FastAPI backend, SQLite database. FastAPI chosen over Django for a lean API surface.
- **Database:** pure SQLite everywhere (user chose "go with required tech stack" over Supabase/Postgres alternatives). Deployed instance re-seeds on boot if empty; README notes the Render free-tier ephemeral-disk caveat.
- **Hosting:** frontend on Vercel, backend on Render free tier (`render.yaml` blueprint). Both deploy from one public GitHub repo.
- **Architecture:** browser calls FastAPI directly (CORS); no Next.js proxy layer, no RSC data fetching for the interactive views.
- **Auth:** none — single implicit default creator, per the assignment's simplification note.

## Architecture

```
frontend/  Next.js 15 (App Router, TypeScript, Tailwind) — Vercel
backend/   FastAPI + SQLAlchemy 2 + Pydantic v2 + SQLite — Render (free tier)
```

- `NEXT_PUBLIC_API_URL` points the frontend at the API; backend `CORS_ORIGINS` allows the Vercel domain and localhost.
- Key frontend libraries: `@dnd-kit` (drag-and-drop), `framer-motion` (transitions), TanStack Query (fetching/cache), toast component for notifications.
- Backend startup: create tables, seed if DB empty — 2 published forms with mixed question types plus sample responses.

## Database schema (SQLite)

```
forms
  id                 INTEGER PK
  title              TEXT NOT NULL
  status             TEXT ('draft' | 'published')
  public_id          TEXT UNIQUE   -- short random slug for the share link
  thank_you_message  TEXT          -- settings placeholder
  created_at / updated_at

questions
  id            INTEGER PK
  form_id       FK → forms (CASCADE delete)
  type          TEXT ('short_text','long_text','multiple_choice','dropdown',
                      'email','number','yes_no','rating')
  title         TEXT
  description   TEXT NULL     -- help text
  required      BOOLEAN
  position      INTEGER       -- order within form
  settings      JSON NULL     -- type-specific (e.g. rating max = 5/10)

question_options              -- for multiple_choice & dropdown
  id            INTEGER PK
  question_id   FK → questions (CASCADE)
  label         TEXT
  position      INTEGER

responses
  id            INTEGER PK
  form_id       FK → forms (CASCADE)
  submitted_at  DATETIME

answers
  id            INTEGER PK
  response_id   FK → responses (CASCADE)
  question_id   FK → questions (CASCADE)
  value         TEXT          -- normalized string form of the answer
```

Rationale: normalized `question_options` table demonstrates proper relationships (evaluation criterion); the `settings` JSON column absorbs type-specific config without schema sprawl.

## API design (JSON, `/api` prefix)

### Creator endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/forms` | List forms with status + response count |
| POST | `/api/forms` | Create form |
| GET | `/api/forms/{id}` | Full form with questions/options |
| PATCH | `/api/forms/{id}` | Rename / settings / publish & unpublish (status field) |
| DELETE | `/api/forms/{id}` | Delete |
| POST | `/api/forms/{id}/duplicate` | Duplicate with questions |
| POST | `/api/forms/{id}/questions` | Add question |
| PATCH | `/api/questions/{id}` | Edit question (+ replace options) |
| DELETE | `/api/questions/{id}` | Delete question |
| PUT | `/api/forms/{id}/questions/order` | Persist drag-and-drop order |
| GET | `/api/forms/{id}/responses` | Responses table |
| GET | `/api/responses/{id}` | Single response, full detail |
| GET | `/api/forms/{id}/summary` | Per-question stats (choice counts, averages) |

### Public endpoints (no auth; published forms only)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/public/forms/{public_id}` | Form definition for respondent flow |
| POST | `/api/public/forms/{public_id}/responses` | Submit; server-side validation (required, email format, number, option membership) → 422 with per-question errors |

## Frontend pages

```
/                      Dashboard — form list: title, status chip, response count,
                       updated time; create / rename / duplicate / delete /
                       publish–unpublish; copy share link on published forms
/forms/[id]/edit       Builder (Typeform "Create" view)
/forms/[id]/results    Results — Summary tab + Responses tab + response detail
/f/[publicId]          Public respondent flow (shareable, no auth)
```

Structure: shared UI primitives (`Button`, `Modal`, `Toast`, `Menu`), feature folders `dashboard/`, `builder/`, `respondent/`, `results/`, a thin typed API client (`lib/api.ts`) and TanStack Query hooks per feature.

## Builder UX

Three-panel layout:

- **Left rail:** ordered question list — drag handles (@dnd-kit vertical sort), type icon + number, add-question button opening a type-picker menu (8 types, colored Typeform-style icons), duplicate/delete per row.
- **Center canvas — live preview:** selected question rendered exactly as the respondent sees it (same components reused). Inline editing: click title/description in the canvas to type directly.
- **Right panel:** per-question settings — required toggle, description field, type-specific settings (options editor for choice/dropdown, rating scale selector); form-level Settings with thank-you message and a disabled "Theme — coming soon" placeholder.
- **Top bar:** back link, inline-editable form title, autosave indicator ("Saving… / Saved"), View (opens `/f/…`), Publish button.
- Autosave: 500ms debounce through granular question endpoints; reorder persists on drop via the order endpoint.

Mocked/placeholder per assignment: logic/branching, integrations/webhooks, team collaboration, payment/file-upload types — "Coming soon" placeholders where natural.

## Respondent flow

- Full-screen, one question at a time; framer-motion vertical slide+fade (up on advance, down on back).
- Question layout: number + arrow prefix, title, help text, input, OK button with "press Enter ↵" hint.
- Keyboard: Enter advances; ↑/↓ navigate; choice/yes-no via letter keys (A, B, C…) with lettered-box option styling; rating via number keys.
- Bottom-right up/down nav arrows; thin progress bar with percentage.
- Client validation inline ("Please fill this in", "Hmm… that email doesn't look right") before advancing; server re-validates on submit.
- Submit → thank-you screen using the form's configured message. Unknown/unpublished slug → friendly "form not found" screen.

## Deployment

- **Backend → Render:** `render.yaml` (Python web service, uvicorn, `DATABASE_URL=sqlite:///./data/app.db`, `CORS_ORIGINS`). Seeds on boot if empty.
- **Frontend → Vercel:** project root `frontend/`, `NEXT_PUBLIC_API_URL` = Render URL.
- README: setup instructions, tech stack, architecture overview, schema, API table, assumptions (auth simplification, ephemeral-disk note).

## Testing

- **Backend:** pytest against a temp SQLite DB — form CRUD, publish flow, question reorder, public submission including every validation rule, summary stats.
- **Frontend:** strict TypeScript + production build as the gate; manual verification of builder and respondent flows in the browser during development.

## Error handling

- API returns structured errors: 404 for missing/unpublished public forms, 422 with per-question detail for validation failures, standard FastAPI validation elsewhere.
- Frontend: toasts for mutation failures; inline field errors in the respondent flow; friendly not-found screens.
