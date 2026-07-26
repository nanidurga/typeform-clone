# Typeform Clone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the assignment's Typeform clone — drag-and-drop form builder, publishable share links, one-question-at-a-time respondent flow, and results views — with FastAPI+SQLite backend and Next.js frontend, deployable to Render + Vercel.

**Architecture:** Two independent apps in one repo: `backend/` (FastAPI + SQLAlchemy 2 + Pydantic v2 + SQLite, seeded on boot) and `frontend/` (Next.js 15 App Router + TypeScript + Tailwind). The browser calls the API directly; CORS allows the frontend origin. No auth (single implicit creator).

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2, Pydantic v2, pytest, httpx; Next.js 15, React 19, TypeScript strict, Tailwind CSS, @tanstack/react-query, @dnd-kit/core+sortable, framer-motion, sonner (toasts).

## Global Constraints

- Question types (exact strings): `short_text`, `long_text`, `multiple_choice`, `dropdown`, `email`, `number`, `yes_no`, `rating`.
- Form status values: `draft`, `published`.
- Yes/no answers stored as `"Yes"` / `"No"`; rating stored as integer string; choice/dropdown answers stored as the option **label**.
- Email validation regex (both sides): `^[^@\s]+@[^@\s]+\.[^@\s]+$`.
- Rating max comes from `question.settings.max` (5 or 10, default 5).
- Question `type` is immutable after creation (delete + re-add to change).
- Frontend gate: `tsc --noEmit` strict + `next build` must pass. Backend gate: `pytest` green.
- DB URL from env `DATABASE_URL`, default `sqlite:///./data/app.db`. CORS origins from env `CORS_ORIGINS` (comma-separated), default `http://localhost:3000`.
- API base URL in frontend from `NEXT_PUBLIC_API_URL`, default `http://localhost:8000`.
- Commits after every task minimum.

---

### Task 1: Backend scaffold + health endpoint

**Files:**
- Create: `backend/requirements.txt`, `backend/app/__init__.py`, `backend/app/config.py`, `backend/app/database.py`, `backend/app/main.py`, `backend/tests/__init__.py`, `backend/tests/conftest.py`, `backend/tests/test_health.py`, `.gitignore`

**Interfaces:**
- Produces: `app.database.Base`, `get_db` dependency, `app.main.app` (FastAPI instance), test fixture `client` (httpx TestClient with temp SQLite).

- [ ] Step 1: `.gitignore` (root): `__pycache__/`, `*.pyc`, `.venv/`, `backend/data/`, `node_modules/`, `.next/`, `.env*`, `*.db`
- [ ] Step 2: `requirements.txt`: fastapi, uvicorn[standard], sqlalchemy, pydantic, pytest, httpx
- [ ] Step 3: `config.py` reads `DATABASE_URL`, `CORS_ORIGINS` from env with defaults above. `database.py`: engine (`check_same_thread=False` for SQLite), `SessionLocal`, `Base(DeclarativeBase)`, `get_db` yield dependency; ensure parent dir of sqlite path exists.
- [ ] Step 4: `main.py`: FastAPI app, CORSMiddleware from config, `GET /api/health` → `{"status": "ok"}`.
- [ ] Step 5: `conftest.py`: fixture creating temp-file SQLite DB, override `get_db`, create tables, yield `TestClient`.
- [ ] Step 6: `test_health.py::test_health` asserts 200 + body. Run `pytest` → PASS. Commit: `feat(backend): scaffold FastAPI app with health check`.

### Task 2: SQLAlchemy models

**Files:**
- Create: `backend/app/models.py`, `backend/tests/test_models.py`

**Interfaces:**
- Produces models: `Form(id, title, status, public_id, thank_you_message, created_at, updated_at, questions↕, responses↕)`, `Question(id, form_id, type, title, description, required, position, settings JSON, options↕)`, `QuestionOption(id, question_id, label, position)`, `Response(id, form_id, submitted_at, answers↕)`, `Answer(id, response_id, question_id, value)`. All child relationships `cascade="all, delete-orphan"`; questions/options ordered by `position`.

- [ ] Step 1: Write `test_models.py`: create form with 2 questions (one with options) + response with answers in a session; delete form; assert questions/options/responses/answers all gone (cascade). Run → FAIL (no models).
- [ ] Step 2: Implement models per interface. `public_id` unique+indexed. `updated_at` onupdate. Run tests → PASS. Commit: `feat(backend): add SQLAlchemy models for forms, questions, responses`.

### Task 3: Forms CRUD API

**Files:**
- Create: `backend/app/schemas.py`, `backend/app/routers/__init__.py`, `backend/app/routers/forms.py`, `backend/app/utils.py`, `backend/tests/test_forms.py`
- Modify: `backend/app/main.py` (include router)

**Interfaces:**
- Produces endpoints: `GET /api/forms` → `[FormListItem{id,title,status,public_id,response_count,updated_at,question_count}]`; `POST /api/forms {title}` → `FormDetail` (201); `GET /api/forms/{id}` → `FormDetail{id,title,status,public_id,thank_you_message,created_at,updated_at,questions:[QuestionOut{id,type,title,description,required,position,settings,options:[{id,label,position}]}]}`; `PATCH /api/forms/{id} {title?,status?,thank_you_message?}`; `DELETE /api/forms/{id}` → 204; `POST /api/forms/{id}/duplicate` → FormDetail of copy.
- Produces: `utils.generate_public_id()` → 10-char url-safe slug, retried on collision.

- [ ] Step 1: Tests: create → get (fields, empty questions, status draft, public_id present); list shows response_count 0; patch title & status publish/unpublish; delete → 404 after; duplicate copies title+" (copy)", questions+options, resets status to draft, new public_id, 0 responses; 404s for missing ids. Run → FAIL.
- [ ] Step 2: Implement schemas (Pydantic v2, `from_attributes=True`), router with SQLAlchemy queries (list uses `func.count` outerjoin for response_count), duplicate deep-copies questions/options. Run → PASS. Commit: `feat(backend): forms CRUD, publish, duplicate endpoints`.

### Task 4: Questions API

**Files:**
- Create: `backend/app/routers/questions.py`, `backend/tests/test_questions.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- `POST /api/forms/{form_id}/questions {type,title?,description?,required?,settings?,options?:[str]}` → QuestionOut (appended at end, default title "..." per type); `PATCH /api/questions/{id} {title?,description?,required?,settings?,options?:[str]}` (options = full replace; type NOT editable); `DELETE /api/questions/{id}` → 204, remaining positions compacted; `PUT /api/forms/{form_id}/questions/order {question_ids:[int]}` → 200, must be exact permutation of the form's question ids else 422.

- [ ] Step 1: Tests: add appends with correct position; add multiple_choice with options list; patch replaces options wholesale; delete compacts positions; reorder happy path + rejects wrong id set; invalid type → 422. Run → FAIL.
- [ ] Step 2: Implement. Run → PASS. Commit: `feat(backend): question add/edit/delete/reorder endpoints`.

### Task 5: Public form + submission with validation

**Files:**
- Create: `backend/app/routers/public.py`, `backend/app/validation.py`, `backend/tests/test_public.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- `GET /api/public/forms/{public_id}` → FormDetail (404 if missing or status != published).
- `POST /api/public/forms/{public_id}/responses {answers: [{question_id, value}]}` → 201 `{id}`; 404 unpublished; 422 `{detail: {errors: [{question_id, message}]}}` on rule failures.
- `validation.validate_answers(questions, answers_dict) -> list[{question_id,message}]` with rules: required+empty → "This field is required"; email regex; number parses as float; rating int in 1..settings.max(default 5); multiple_choice/dropdown value ∈ option labels; yes_no ∈ {"Yes","No"}. Empty optional answers are skipped (not stored).

- [ ] Step 1: Tests covering: draft form 404 on both endpoints; happy submission stores response+answers; each validation rule failing individually returns 422 with the right question_id; unknown question_id in payload → 422; optional blank skipped. Run → FAIL.
- [ ] Step 2: Implement validation module + router. Run → PASS. Commit: `feat(backend): public form endpoint and validated response submission`.

### Task 6: Results API

**Files:**
- Create: `backend/app/routers/results.py`, `backend/tests/test_results.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- `GET /api/forms/{id}/responses` → `{total, items: [{id, submitted_at, answers:[{question_id, value}]}]}` newest first.
- `GET /api/responses/{id}` → `{id, form_id, submitted_at, answers:[{question_id, question_title, question_type, value}]}`.
- `GET /api/forms/{id}/summary` → `{response_count, questions: [{question_id, title, type, answered_count, stats}]}` where stats: choice-like (mc/dropdown/yes_no) → `{counts: {label: n}}` including zero-count options; rating → `{average, distribution: {value: n}, max}`; number → `{average}`; text/email → `{latest: [up to 5 values]}`.

- [ ] Step 1: Tests with seeded fixture data: list order + shape; detail includes titles; summary counts (incl. zero-count option), rating average/distribution, number average, text latest. 404s. Run → FAIL.
- [ ] Step 2: Implement. Run → PASS. Commit: `feat(backend): responses list/detail and per-question summary stats`.

### Task 7: Seed data + startup

**Files:**
- Create: `backend/app/seed.py`
- Modify: `backend/app/main.py` (lifespan: create tables, seed if `forms` empty)
- Create: `backend/tests/test_seed.py`

**Interfaces:**
- `seed.seed_if_empty(db)` — creates 2 published forms ("Customer Feedback Survey", "Event Registration") together using all 8 question types, plus 1 draft form ("Product Research — Draft"); 6–8 realistic responses across the published forms. Idempotent.

- [ ] Step 1: Test: run twice on empty DB → same counts; forms have expected statuses/types; responses valid. Run → FAIL.
- [ ] Step 2: Implement + wire lifespan. Run full `pytest` → PASS. Commit: `feat(backend): seed data on startup`.

### Task 8: Frontend scaffold + API client

**Files:**
- Create (via create-next-app then edit): `frontend/` with TS+Tailwind+App Router, `frontend/src/lib/types.ts`, `frontend/src/lib/api.ts`, `frontend/src/lib/query.tsx` (QueryClientProvider + sonner `<Toaster>`), `frontend/src/app/layout.tsx`, `frontend/src/app/globals.css`

**Interfaces:**
- `types.ts`: `QuestionType` union, `Question`, `QuestionOption`, `FormDetail`, `FormListItem`, `SummaryQuestion`, `ResponseListItem`, `ResponseDetail`, `AnswerIn` — mirroring backend schemas exactly.
- `api.ts`: `api.listForms()`, `createForm(title)`, `getForm(id)`, `updateForm(id, patch)`, `deleteForm(id)`, `duplicateForm(id)`, `addQuestion(formId, payload)`, `updateQuestion(id, patch)`, `deleteQuestion(id)`, `reorderQuestions(formId, ids)`, `getPublicForm(publicId)`, `submitResponse(publicId, answers)` (throws `SubmissionError` carrying per-question errors on 422), `listResponses(formId)`, `getResponse(id)`, `getSummary(formId)`. All typed, single `request()` helper using `NEXT_PUBLIC_API_URL`.
- Design tokens in globals.css: near-black `#191919` text, off-white `#fafafa` bg, Typeform-ish accent (dark slate buttons, `#0445af` links), Inter via `next/font`.

- [ ] Steps: scaffold; install `@tanstack/react-query framer-motion @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities sonner`; write types + client + provider; verify `npm run build` passes. Commit: `feat(frontend): scaffold Next.js app with typed API client`.

### Task 9: Shared UI primitives

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`, `Modal.tsx`, `Menu.tsx` (dropdown), `Spinner.tsx`, `StatusBadge.tsx`

**Interfaces:**
- `Button({variant: 'primary'|'secondary'|'ghost'|'danger', size?, ...})`; `Modal({open, onClose, title, children, footer?})` with backdrop + Escape close; `Menu({trigger, items: [{label, onClick, danger?, icon?}]})` closing on outside click; `StatusBadge({status})` draft=gray, published=green.

- [ ] Steps: implement each with Tailwind, Typeform-flat styling (rounded-lg, subtle shadows). Gate: `npm run build`. Commit: `feat(frontend): shared UI primitives`.

### Task 10: Dashboard (form management)

**Files:**
- Create: `frontend/src/app/page.tsx`, `frontend/src/components/dashboard/FormRow.tsx`, `CreateFormModal.tsx`, `RenameFormModal.tsx`, `frontend/src/lib/hooks.ts` (React Query hooks + mutations with toast on error/success)

**Interfaces:**
- Consumes `api.listForms` etc. Produces hooks: `useForms()`, `useForm(id)`, `useCreateForm()`, `useUpdateForm()`, `useDeleteForm()`, `useDuplicateForm()` — mutations invalidate `['forms']`.
- Dashboard: header "My workspace" + "Create typeform" button; list rows: title (links to builder), StatusBadge, response count (links to results), updated date, ⋯ Menu (Open, Results, Rename, Duplicate, Publish/Unpublish, Copy link [published only, `navigator.clipboard` + toast], Delete [confirm modal]). Empty state card. Delete/publish/etc show toasts.

- [ ] Steps: hooks → components → page; verify against running backend in browser; build gate. Commit: `feat(frontend): dashboard with form management`.

### Task 11: Question input components (shared preview/fill)

**Files:**
- Create: `frontend/src/components/questions/QuestionScreen.tsx`, `TextInput.tsx`, `LongTextInput.tsx`, `ChoiceList.tsx`, `DropdownInput.tsx`, `YesNoInput.tsx`, `RatingInput.tsx`, `NumberInput.tsx`, `EmailInput.tsx`, `index.ts` (registry `QUESTION_TYPE_META`: label, icon, color per type)

**Interfaces:**
- `QuestionScreen({question, index, value, onChange, onSubmit, error, editable?, onEditTitle?, onEditDescription?})` — renders "N →" prefix, title (or inline `contentEditable`-style input when `editable`), description, the type-specific input, error text, OK button + "press **Enter ↵**" hint.
- Inputs share `{question, value: string, onChange(v: string), onSubmit()}`. ChoiceList renders lettered boxes (A/B/C…), keyboard letters select; YesNo = 2-option ChoiceList variant storing Yes/No; Rating renders 1..max boxes; Dropdown = styled select-like list. Text inputs are borderless bottom-border style, large type.

- [ ] Steps: registry + each input + QuestionScreen; build gate. Commit: `feat(frontend): question input components for all 8 types`.

### Task 12: Respondent flow

**Files:**
- Create: `frontend/src/app/f/[publicId]/page.tsx`, `frontend/src/components/respondent/FormFiller.tsx`, `WelcomelessFlow` logic inside, `ThankYouScreen.tsx`, `ProgressBar.tsx`, `NavArrows.tsx`, `frontend/src/lib/respondentValidation.ts`

**Interfaces:**
- `respondentValidation.validateAnswer(question, value) -> string | null` mirroring backend messages: "Please fill this in", "Hmm… that email doesn't look right", "Numbers only, please", "Please select an option".
- FormFiller: state `{answers: Record<qid,string>, current, direction, submitted}`; framer-motion `AnimatePresence` vertical slide+fade keyed on `current`; Enter advances (validate first), ↑/↓ + on-screen arrows navigate (down also validates); auto-advance on choice/yes-no/rating click after 250ms; progress bar % answered; final question OK → submit all → server errors jump to first offending question with message; success → ThankYouScreen (form.thank_you_message, "Powered by (clone)" footer). 404 slug → NotFound screen.

- [ ] Steps: validation util → FormFiller → page (fetch public form, loading/404 states); manual browser test with seeded form incl. keyboard nav; build gate. Commit: `feat(frontend): one-question-at-a-time respondent flow`.

### Task 13: Builder

**Files:**
- Create: `frontend/src/app/forms/[id]/edit/page.tsx`, `frontend/src/components/builder/BuilderShell.tsx`, `QuestionListPanel.tsx` (dnd-kit sortable), `AddQuestionMenu.tsx`, `CanvasPreview.tsx`, `SettingsPanel.tsx`, `TopBar.tsx`, `OptionsEditor.tsx`, `frontend/src/lib/useAutosave.ts`

**Interfaces:**
- BuilderShell holds local working copy of FormDetail + `selectedQuestionId`; `useAutosave(question)` debounces 500ms → `api.updateQuestion`, exposes `'saved'|'saving'` for TopBar.
- QuestionListPanel: SortableContext vertical list; row = drag handle, colored type chip + number, truncated title; onDragEnd → optimistic reorder + `api.reorderQuestions`; row menu: duplicate (re-add via addQuestion with same payload), delete.
- AddQuestionMenu: grid of 8 types w/ colored icons from `QUESTION_TYPE_META` → `api.addQuestion` then select it.
- CanvasPreview: renders `QuestionScreen editable` for selected question on a form-bg canvas; title/description edits go into working copy (autosaved).
- SettingsPanel: Required toggle, Description textarea, OptionsEditor (add/edit/remove/reorder labels) for mc/dropdown, rating max selector (5/10); form Settings section: thank_you_message textarea + disabled "Theme — Coming soon" row.
- TopBar: ← back, inline title edit (blur/Enter → updateForm), autosave dot, "View" (open `/f/{public_id}` new tab, disabled hint if draft), Publish/Unpublish button + copy-link on publish (toast).

- [ ] Steps: useAutosave → panels → shell + page; manual browser test: add/edit/reorder/delete, publish, open public link; build gate. Commit: `feat(frontend): drag-and-drop builder with live preview`.

### Task 14: Results

**Files:**
- Create: `frontend/src/app/forms/[id]/results/page.tsx`, `frontend/src/components/results/SummaryTab.tsx`, `ResponsesTab.tsx`, `ResponseDetailModal.tsx`

**Interfaces:**
- Page: header (form title, response count) + tab switcher Summary|Responses.
- SummaryTab: per question card — title, answered_count; choice-like: horizontal bars with counts+%; rating: average big number + distribution bars; number: average; text: latest values list.
- ResponsesTab: table (Date, first 3 question columns truncated, "View" button) → ResponseDetailModal listing every question+answer. Empty states.

- [ ] Steps: implement, browser-verify with seeded data, build gate. Commit: `feat(frontend): results summary and responses views`.

### Task 15: Deployment config + README + final verification

**Files:**
- Create: `render.yaml`, `README.md`, `backend/README.md` (brief run notes), `frontend/.env.example`, `backend/.env.example`
- Modify: anything failing final checks

**Interfaces:**
- `render.yaml`: python web service, rootDir `backend`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, env vars `CORS_ORIGINS`, `DATABASE_URL=sqlite:///./data/app.db`.
- README: overview, tech stack, monorepo layout, local setup (backend + frontend commands), architecture diagram (ascii), schema section, API table, deployment steps (Render blueprint + Vercel root `frontend/` + env vars), assumptions (no auth, ephemeral disk + reseed, type immutability).

- [ ] Steps: write configs/README; run `pytest` (all green), `npm run build` (clean), end-to-end browser pass (create → build → publish → fill → results); commit: `chore: deployment config and README`.
