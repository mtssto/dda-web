# DDA — Deployment Guide

## Architecture Overview

```
┌─────────────────────────┐         ┌──────────────────────────────────┐
│   GitHub Pages          │         │   Railway                        │
│   diegodeaduriz.art     │ ──API──▶│   dda-web-production.up.railway  │
│                         │         │                                  │
│   Static frontend       │         │   Spring Boot backend            │
│   (HTML/CSS/JS)         │         │   + MySQL database               │
└─────────────────────────┘         └──────────────────────────────────┘
```

- **Frontend**: GitHub Pages — auto-deploys when you push to `master`
- **Backend**: Railway — auto-deploys when you push to `master` (from `dda-backend/` root)
- **Database**: Railway MySQL plugin — persistent storage with automatic backups

---

## URLs

| Service | URL |
|---------|-----|
| Frontend (production) | https://diegodeaduriz.art |
| Backend API (production) | https://dda-web-production.up.railway.app/api |
| Railway Dashboard | https://railway.app/dashboard |
| GitHub Repo | https://github.com/mtssto/dda-web |

---

## Accessing the Production Database

### Option 1: Railway Web Console (easiest)

1. Go to [railway.app/dashboard](https://railway.app/dashboard)
2. Click on your project → click on the **MySQL** service
3. Go to the **Data** tab — you can browse tables and run SQL queries directly

### Option 2: MySQL CLI

1. Go to Railway → MySQL service → **Variables** tab
2. Copy the connection details (`MYSQLHOST`, `MYSQLPORT`, `MYSQLDATABASE`, `MYSQLUSER`, `MYSQLPASSWORD`)
3. Connect from your terminal:

```bash
mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p<MYSQLPASSWORD> <MYSQLDATABASE>
```

Or use the `MYSQL_URL` variable (Railway provides it):

```bash
mysql <MYSQL_URL>
```

### Option 3: GUI Tools (MySQL Workbench, DBeaver, TablePlus)

1. Get connection details from Railway → MySQL → **Variables** tab
2. Create a new connection in your GUI tool:
   - **Host**: value of `MYSQLHOST`
   - **Port**: value of `MYSQLPORT`
   - **Database**: value of `MYSQLDATABASE`
   - **User**: value of `MYSQLUSER`
   - **Password**: value of `MYSQLPASSWORD`
   - **SSL**: enabled (Railway requires SSL for external connections)

### Useful SQL Queries

```sql
-- View all users
SELECT id, username, email, role FROM users;

-- View all artworks
SELECT id, title, category, sold FROM artworks;

-- View artwork count per category
SELECT c.name, COUNT(a.id) as count
FROM categories c
LEFT JOIN artworks a ON a.category_id = c.id
GROUP BY c.name;

-- Check who is admin
SELECT username, role FROM users WHERE role = 'ADMIN';
```

---

## Environment Variables (Railway Backend)

These are set in Railway → dda-web service → Variables:

| Variable | Value | Description |
|----------|-------|-------------|
| `SPRING_PROFILES_ACTIVE` | `prod` | Activates production profile (MySQL instead of H2) |
| `JWT_SECRET` | `<your-secret>` | 64-char hex string for signing JWT tokens |
| `DB_HOST` | `${{MySQL.MYSQLHOST}}` | Auto-filled from MySQL plugin |
| `DB_PORT` | `${{MySQL.MYSQLPORT}}` | Auto-filled from MySQL plugin |
| `DB_NAME` | `${{MySQL.MYSQLDATABASE}}` | Auto-filled from MySQL plugin |
| `DB_USERNAME` | `${{MySQL.MYSQLUSER}}` | Auto-filled from MySQL plugin |
| `DB_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` | Auto-filled from MySQL plugin |

---

## Frontend Configuration

The API base URL is configured in a single file:

**`shop/config.js`**
```javascript
window.DDA_API_BASE = 'https://dda-web-production.up.railway.app/api';
```

All pages (`shop.html`, `catalog.html`, `login.html`, `user-login.html`, `admin.html`, `mi-cuenta.html`) load this file before `auth.js`.

### Switching to Local Development

To develop locally, change `config.js` to:
```javascript
window.DDA_API_BASE = '/api';
```

Then run the Python dev server (proxies `/api` to `localhost:8081`):
```bash
# Terminal 1: Start backend
cd dda-backend && mvn spring-boot:run

# Terminal 2: Start frontend
python dev_server.py
# Open http://localhost:8080/shop/shop.html
```

**Important**: Don't commit the local dev URL to master. Keep `config.js` pointing to the Railway URL in production.

---

## Deployment Workflow

### Frontend Changes (HTML/CSS/JS)

1. Make changes on a branch
2. Create PR → merge to `master`
3. GitHub Pages auto-deploys (takes ~1 minute)
4. Verify at https://diegodeaduriz.art

### Backend Changes (Java/Spring Boot)

1. Make changes in `dda-backend/` on a branch
2. Create PR → merge to `master`
3. Railway auto-deploys from the `dda-backend/` root directory (takes ~3-5 minutes)
4. Verify at https://dda-web-production.up.railway.app/api/artworks

### Database Changes (Migrations)

Database migrations use **Flyway** and are located in:
```
dda-backend/src/main/resources/db/migration/
```

To add a new migration:
1. Create a file: `V<number>__description.sql` (e.g., `V5__add_user_email_index.sql`)
2. Write the SQL
3. Commit and push — Railway will run the migration automatically on deploy

---

## Login & Roles

| Page | URL | Who |
|------|-----|-----|
| User Login | `/shop/user-login.html` | Regular users (sign up + sign in) |
| Admin Login | `/shop/login.html` | Admins only (sign in only) |
| Admin Dashboard | `/shop/admin.html` | Admins — manage artworks |
| Mi Cuenta | `/shop/mi-cuenta.html` | All logged-in users — profile, favorites |

- The **first user** registered gets `ADMIN` role automatically
- All subsequent users get `USER` role
- Non-admin users are blocked from accessing `login.html` and `admin.html`

---

## Custom Domain for API (Optional)

If you want `api.diegodeaduriz.art` instead of the Railway URL:

1. In Railway → dda-web service → **Settings** → **Networking** → **Custom Domain** → add `api.diegodeaduriz.art`
2. Add a DNS CNAME record at your domain registrar:
   - **Name**: `api`
   - **Value**: the Railway domain Railway tells you to point to
3. Update `shop/config.js`:
   ```javascript
   window.DDA_API_BASE = 'https://api.diegodeaduriz.art/api';
   ```
4. Commit and push to master

---

## Troubleshooting

### Backend not responding
- Check Railway dashboard for deploy logs
- Verify environment variables are set correctly
- Check that Root Directory is `dda-backend`

### CORS errors in browser console
- The backend allows origins: `diegodeaduriz.art`, `www.diegodeaduriz.art`, `localhost:8080`, `localhost:3000`
- If you use a custom API domain, no CORS changes needed

### Database connection errors
- Verify `SPRING_PROFILES_ACTIVE=prod` is set
- Check that MySQL service is online in Railway
- Verify `DB_*` variables reference the MySQL plugin correctly (`${{MySQL.*}}`)

### JWT errors / "Sesión expirada"
- Tokens expire after 24 hours — user needs to log in again
- If you change `JWT_SECRET`, all existing tokens become invalid

### H2 Console (local dev only)
- URL: http://localhost:8081/h2-console
- JDBC URL: `jdbc:h2:mem:ddadb;MODE=MySQL`
- User: `sa`, Password: (empty)
