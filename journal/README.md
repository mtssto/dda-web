# Artist Notebook (Cuaderno / Journal)

Editorial journal section for Diego De Aduriz — process notes, exhibitions, and studio archive.

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Entry listing with tag filters |
| `post.html?slug=…` | Single post with likes, saves, comments |
| `profile.html` | Saved entries (requires login) |
| `admin.html` | Post editor, newsletter analytics, comment moderation (admin) |

## Data

- **Static fallback:** `data/posts.json` (works on GitHub Pages without API)
- **API:** `GET /api/journal/posts`, `GET /api/journal/posts/slug/{slug}` (see `dda-backend/INTEGRATION.md`)

## i18n

Uses `i18n/platform-translations.js` + `i18n.js`. Language preference: `localStorage.preferredLanguage` (`es` | `en`).
