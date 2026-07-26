# Frontend — Next.js + TypeScript

See the [root README](../README.md) for full documentation.

```bash
npm install
npm run dev     # http://localhost:3000 (expects the API on :8000)
npm run build   # production build + type check
```

Layout: `src/app/` (routes: dashboard `/`, builder `/forms/[id]/edit`,
results `/forms/[id]/results`, public fill `/f/[publicId]`),
`src/components/` (`ui/`, `dashboard/`, `builder/`, `questions/`,
`respondent/`, `results/`), `src/lib/` (typed API client, hooks, validation).

Set `NEXT_PUBLIC_API_URL` to point at the backend (see `.env.example`).
