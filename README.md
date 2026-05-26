# Diego De Aduriz — Artist Website & Shop

Full-stack website for the Argentine visual artist **Diego De Aduriz**. A static frontend hosted on GitHub Pages connects to a Spring Boot REST API deployed on Railway, powering an art shop, editorial journal, newsletter, and portfolio.

**Live site:** [diegodeaduriz.art](https://diegodeaduriz.art)

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     GitHub Pages (static)                        │
│  diegodeaduriz.art / whitewidow.github.io                       │
│                                                                  │
│  index.html ─ landing page with collage background               │
│  shop/      ─ art catalog, cart, checkout, admin panel           │
│  journal/   ─ blog posts, comments, profile, admin editor        │
│  portfolio/ ─ exhibition sections (static HTML)                  │
│  muestras/  ─ past exhibitions                                   │
│  bio/       ─ artist biography                                   │
│  prensa/    ─ press coverage                                     │
│  textos/    ─ publications                                       │
│  proyectos/ ─ projects                                           │
│  react-build/ & 3d-react-gallery/ ─ immersive 3D gallery (R3F)  │
└──────────────────┬───────────────────────────────────────────────┘
                   │ HTTPS (fetch)
                   ▼
┌──────────────────────────────────────────────────────────────────┐
│              Spring Boot Backend (Railway)                        │
│  dda-web-production.up.railway.app                               │
│                                                                  │
│  /api/auth/*        ─ JWT authentication                         │
│  /api/artworks/*    ─ artwork CRUD, search, comments             │
│  /api/categories/*  ─ category management                        │
│  /api/artworks/*/images ─ image upload (Cloudinary)              │
│  /api/journal/*     ─ blog posts, comments, admin                │
│  /api/newsletter/*  ─ subscribe/unsubscribe, send campaigns      │
│  /uploads/*         ─ uploaded file serving                      │
└──────────────────┬───────────────────────────────────────────────┘
                   │
                   ▼
         MySQL 8 (Railway)  +  Cloudinary (images)  +  Resend (email)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla HTML/CSS/JS, i18n (ES/EN), Google Fonts (Inter, Playfair Display) |
| **3D Gallery** | React, Three.js, React Three Fiber, Vite |
| **Backend** | Java 17, Spring Boot 3.3.5, Spring Security, Spring Data JPA |
| **Auth** | JWT (JJWT 0.12.6), role-based (USER / ADMIN) |
| **Database** | MySQL 8 (prod) / H2 in-memory (dev), Flyway migrations |
| **Image Storage** | Cloudinary (prod) / local `uploads/` folder (dev) |
| **Email** | Resend HTTP API |
| **Caching** | Caffeine (artworks, categories, users — 10 min TTL) |
| **Hosting** | GitHub Pages (frontend), Railway (backend + MySQL) |
| **Analytics** | Google Analytics (G-87SFZWVTQC) |
| **Build** | Maven, Docker (multi-stage) |

---

## Frontend Pages

| Path | Description |
|------|-------------|
| `/` | Landing page — animated collage background, navigation hub |
| `/shop/shop.html` | Art catalog with category filters and search |
| `/shop/obra.html?slug=…` | Single artwork detail (images, comments, purchase) |
| `/shop/cart.html` | Shopping cart |
| `/shop/admin.html` | Admin panel — artwork CRUD, image uploads |
| `/shop/login.html` | Admin login |
| `/shop/user-login.html` | User login/register |
| `/shop/mi-cuenta.html` | User account page |
| `/journal/index.html` | Blog listing with tag filters |
| `/journal/post.html?slug=…` | Single blog post with likes, saves, comments |
| `/journal/profile.html` | Saved journal entries (requires login) |
| `/journal/admin.html` | Post editor, newsletter analytics, comment moderation |
| `/portfolio/sections/obras.html` | Full artwork portfolio |
| `/bio/bio.html` | Artist biography |
| `/muestras/muestras.html` | Past exhibitions |
| `/prensa/prensa.html` | Press coverage |
| `/textos/textos.html` | Publications |
| `/proyectos/proyectos.html` | Projects |
| `/react-build/index.html` | Immersive 3D gallery ("Universo DDA") |

### Frontend–Backend Connection

The frontend discovers the API through `shop/config.js`:

```javascript
window.DDA_API_BASE = 'https://dda-web-production.up.railway.app/api';
window.DDA_MEDIA_BASE = 'https://dda-web-production.up.railway.app';
```

During local development, `dev_server.py` overrides this to `'/api'` and proxies requests to `localhost:8081`.

### Internationalization

The site supports Spanish and English. Language preference is stored in `localStorage.preferredLanguage` (`es` | `en`). Translation files live in `i18n/`.

---

## Backend API Endpoints

**Base URL (prod):** `https://dda-web-production.up.railway.app/api`
**Base URL (dev):** `http://localhost:8081/api`

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | — | Register a new user |
| `POST` | `/api/auth/login` | — | Login, returns JWT token |

All protected endpoints require `Authorization: Bearer <token>` header.

### Artworks

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/artworks` | — | List all artworks (paginated) |
| `GET` | `/api/artworks/{slug}` | — | Get artwork by slug |
| `GET` | `/api/artworks/category/{name}` | — | Filter by category (paginated) |
| `GET` | `/api/artworks/search?q=…` | — | Search by title, technique, or dimensions |
| `GET` | `/api/artworks/{slug}/comments` | — | List approved comments on an artwork |
| `GET` | `/api/artworks/me/comments` | User | List current user's comments |
| `POST` | `/api/artworks/{slug}/comments` | User | Add a comment to an artwork |
| `POST` | `/api/artworks` | Admin | Create a new artwork |
| `PUT` | `/api/artworks/{id}` | Admin | Update an artwork |
| `PATCH` | `/api/artworks/{id}/sold` | Admin | Toggle sold status |
| `DELETE` | `/api/artworks/{id}` | Admin | Delete an artwork |

**Pagination params:** `page` (default 0), `size` (default 20), `sort` (e.g. `title,asc`, `createdAt,desc`, `price,asc`)

### Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/categories` | — | List all categories with artwork counts |
| `POST` | `/api/categories` | Admin | Create a category |
| `PUT` | `/api/categories/{id}` | Admin | Update a category |

### Images

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/artworks/{id}/images` | Admin | Upload image (multipart, `file` + optional `primary=true`) |
| `DELETE` | `/api/images/{id}` | Admin | Delete an image |

Accepted formats: JPEG, PNG, WebP, GIF. Max size: 10 MB.

### Journal (Blog)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/journal/posts` | — | List published posts (paginated) |
| `GET` | `/api/journal/posts/slug/{slug}` | — | Get a post by slug |
| `GET` | `/api/journal/posts/{id}/comments` | — | List approved comments on a post |
| `POST` | `/api/journal/posts/{id}/comments` | User | Add a comment |
| `GET` | `/api/journal/admin/posts` | Admin | List all posts (incl. drafts) |
| `POST` | `/api/journal/admin/posts` | Admin | Create a post |
| `PUT` | `/api/journal/admin/posts/{id}` | Admin | Update a post |
| `DELETE` | `/api/journal/admin/posts/{id}` | Admin | Delete a post |
| `POST` | `/api/journal/admin/upload` | Admin | Upload a journal image |
| `GET` | `/api/journal/admin/comments` | Admin | List pending comments |
| `PATCH` | `/api/journal/admin/comments/{id}/approve` | Admin | Approve a comment |

### Newsletter

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/newsletter/subscribe` | — | Subscribe to newsletter (`{ "email": "…", "source": "web" }`) |
| `POST` | `/api/newsletter/unsubscribe` | — | Unsubscribe |
| `GET` | `/api/newsletter/subscribers` | Admin | List active subscribers |
| `POST` | `/api/newsletter/send` | Admin | Send newsletter (`{ "subject": "…", "body": "…" }`) |
| `GET` | `/api/newsletter/admin/campaigns` | Admin | Campaign analytics |

### Admin Migration

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/admin/migration/cloudinary` | Admin | Migrate local images to Cloudinary |

### Static File Serving

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/uploads/{filename}` | — | Serve uploaded files |

---

## Local Development

### Prerequisites

- **Java 17+** and **Maven 3.6+**
- **Python 3** (for the dev server)
- **Node.js 18+** (only if running the 3D gallery)

### Quick Start

```bash
# 1. Start everything (backend + static site + API proxy)
python dev_server.py

# 2. Or start only the static site (if backend is already running)
python dev_server.py --site-only

# 3. Also start the 3D gallery (Vite dev server on :5173)
python dev_server.py --with-gallery
```

The dev server binds to **http://127.0.0.1:8000** and automatically:
- Serves all static files from the repo root
- Proxies `/api/*` and `/uploads/*` to the Spring Boot backend on `:8081`
- Overrides `shop/config.js` so the frontend talks to the local backend

### Dev Admin Account

The `dev` profile auto-seeds an admin user (H2 is wiped on each restart):

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |
| Email | `admin@localhost` |

Override via env vars: `DDA_ADMIN_USERNAME`, `DDA_ADMIN_PASSWORD`, `DDA_ADMIN_EMAIL`.

### H2 Console (Dev Only)

Available at **http://localhost:8081/h2-console**
- JDBC URL: `jdbc:h2:mem:ddadb`
- User: `sa`, no password

### Running Backend Standalone

```bash
cd dda-backend
mvn spring-boot:run                              # dev profile (H2)
mvn spring-boot:run -Dspring-boot.run.profiles=prod  # prod profile (MySQL)
```

---

## Environment Variables

### Required for Production

| Variable | Description |
|----------|-------------|
| `SPRING_PROFILES_ACTIVE` | Set to `prod` |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port (usually `3306`) |
| `DB_NAME` | Database name (e.g. `dda_art_shop`) |
| `DB_USERNAME` | Database user |
| `DB_PASSWORD` | Database password |
| `JWT_SECRET` | Secret key for JWT signing (min 256 bits) |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8081` |
| `UPLOAD_DIR` | Local upload directory | `uploads` |
| `STATIC_BASE_URL` | Base URL for static assets | `https://diegodeaduriz.art` |
| `PUBLIC_BASE_URL` | Public backend URL | `https://dda-web-production.up.railway.app` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | — |
| `CLOUDINARY_API_KEY` | Cloudinary API key | — |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | — |
| `DDA_MAIL_ENABLED` | Enable email via Resend | `false` |
| `RESEND_API_KEY` | Resend API key for newsletters | — |
| `DDA_MAIL_FROM` | Newsletter sender address | `DDA <onboarding@resend.dev>` |
| `DDA_COMMENT_NOTIFY_EMAIL` | Email for comment notifications | `admin@diegodeaduriz.art` |
| `DDA_ADMIN_SEED_ENABLED` | Auto-create admin on startup | `false` (auto `true` in dev) |
| `DDA_ADMIN_USERNAME` | Seed admin username | `admin` |
| `DDA_ADMIN_PASSWORD` | Seed admin password | — |
| `DDA_ADMIN_EMAIL` | Seed admin email | `admin@diegodeaduriz.art` |
| `DDA_FLYWAY_REPAIR` | Run Flyway repair on startup | `false` |

---

## Deployment

### Frontend (GitHub Pages)

The frontend is deployed automatically by pushing to the `main` branch. GitHub Pages serves the static files from the repository root.

**Custom domain:** `diegodeaduriz.art` (configured via CNAME or GitHub Pages settings)

To update the frontend:

```bash
git add .
git commit -m "Update frontend"
git push origin main
```

Changes are live within a few minutes after push.

### Backend (Railway)

The backend runs on [Railway](https://railway.app) using the Dockerfile at `dda-backend/Dockerfile`.

**Production URL:** `https://dda-web-production.up.railway.app`

Railway provides:
- Automatic deploys from the repository
- Managed MySQL database
- Environment variable management
- Zero-downtime deploys

To deploy backend changes, push to the branch Railway is tracking. Railway auto-builds and deploys.

### Backend with Docker (Manual)

```bash
cd dda-backend

# Build
docker build -t dda-backend .

# Run in dev mode (H2)
docker run -p 8081:8081 dda-backend

# Run in prod mode (MySQL)
docker run -p 8081:8081 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_HOST=host.docker.internal \
  -e DB_PORT=3306 \
  -e DB_NAME=dda_art_shop \
  -e DB_USERNAME=dda_user \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET=your-256-bit-secret \
  -v $(pwd)/uploads:/app/uploads \
  dda-backend
```

### Production MySQL Setup

```sql
CREATE DATABASE dda_art_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dda_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON dda_art_shop.* TO 'dda_user'@'localhost';
FLUSH PRIVILEGES;
```

Flyway automatically creates all tables and seeds 80 artworks on first run.

### Production Admin Bootstrap

Set these env vars **only once** when initializing a fresh database:

```bash
DDA_ADMIN_SEED_ENABLED=true
DDA_ADMIN_USERNAME=admin
DDA_ADMIN_PASSWORD=your_secure_password
DDA_ADMIN_EMAIL=you@diegodeaduriz.art
```

Remove `DDA_ADMIN_SEED_ENABLED` after the first successful deploy.

---

## Database Schema

Managed by Flyway migrations in `dda-backend/src/main/resources/db/migration/`:

| Table | Description |
|-------|-------------|
| `users` | User accounts with roles (USER, ADMIN) |
| `categories` | Artwork categories (pasteles, ilustraciones, etc.) |
| `artworks` | Artworks with title, description, price, technique, dimensions |
| `artwork_images` | Images linked to artworks (supports primary flag) |
| `artwork_comments` | User comments on artworks (with approval status) |
| `journal_posts` | Blog posts (DRAFT/PUBLISHED status) |
| `journal_comments` | Comments on journal posts (with approval status) |
| `newsletter_subscribers` | Newsletter email subscriptions |

---

## CORS

The backend allows requests from:

- `https://diegodeaduriz.art`
- `https://www.diegodeaduriz.art`
- `https://dda-web-production.up.railway.app`
- `https://whitewidow.github.io`
- `http://localhost:*` (dev)
- `http://127.0.0.1:*` (dev)

---

## Project Structure

```
whitewidow.github.io/
├── index.html                  # Landing page
├── dev_server.py               # Local dev server (static + API proxy)
├── i18n.js                     # Internationalization loader
├── collage-bg.js               # Landing page background animation
├── shop/                       # Art shop (catalog, cart, admin, auth)
│   ├── config.js               # API base URL config
│   ├── catalog-api.js          # Shop API client
│   ├── admin-app.js            # Admin panel logic
│   └── *.html / *.css / *.js
├── journal/                    # Editorial blog
│   ├── index.html / post.html  # Public pages
│   ├── admin.html              # Post editor & moderation
│   └── data/posts.json         # Static fallback (no-API mode)
├── portfolio/sections/         # Exhibition pages (static HTML)
├── bio/ muestras/ prensa/      # Artist info pages
│   textos/ proyectos/
├── 3d-react-gallery/           # React Three Fiber immersive gallery
├── react-build/                # Built 3D gallery for production
├── i18n/                       # Translation files (ES/EN)
├── dda-backend/                # Spring Boot REST API
│   ├── Dockerfile
│   ├── pom.xml
│   ├── src/main/java/com/dda/
│   │   ├── config/             # Security, CORS, Cloudinary, Flyway
│   │   ├── controller/         # REST endpoints
│   │   ├── dto/                # Request/Response objects
│   │   ├── entity/             # JPA entities
│   │   ├── repository/         # Spring Data JPA repos
│   │   ├── service/            # Business logic
│   │   ├── security/           # JWT provider & filter
│   │   └── exception/          # Global error handling
│   └── src/main/resources/
│       ├── application.yml     # Config (dev + prod profiles)
│       └── db/migration/       # Flyway SQL migrations
└── README.md                   # This file
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Backend won't start** | Ensure Java 17+ and Maven 3.6+ are installed. Run `mvn clean install` first. |
| **"Table not found" on startup** | Check Flyway migration logs. For MySQL, verify the database exists and credentials are correct. |
| **Frontend shows no artworks** | Check `shop/config.js` points to the correct backend URL. Check browser console for CORS errors. |
| **JWT token expired** | Tokens expire after 24 hours. Call `/api/auth/login` again. |
| **Image upload fails** | File must be JPEG, PNG, WebP, or GIF. Max 10 MB. Ensure Cloudinary env vars are set in prod. |
| **CORS errors in browser** | Verify the frontend origin is listed in `CorsConfig.java`. For local dev, use `dev_server.py` which proxies API calls. |
| **IntelliJ "Cannot resolve method"** | Right-click `pom.xml` > Maven > Reload Project. Or: File > Invalidate Caches > Restart. |
| **Flyway checksum mismatch** | Set `DDA_FLYWAY_REPAIR=true` for one deploy, then remove it. |

---

## License

This repository contains the personal website and artwork of Diego De Aduriz. All artwork images and content are copyright of the artist.
