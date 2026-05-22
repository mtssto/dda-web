# DDA Art Shop — Backend API

Spring Boot REST API for the Diego De Aduriz art shop. Manages artworks, categories, images, and user authentication.

---

## Prerequisites

- **Java 17** (or higher)
- **Maven 3.6+**
- **MySQL 8** (only for production — dev mode uses H2 in-memory)

---

## Quick Start (Development)

No MySQL needed — the dev profile uses an in-memory H2 database that auto-seeds with all 80 artworks.

```bash
cd dda-backend
mvn spring-boot:run
```

The API will be available at **http://localhost:8081**

The H2 database console is at **http://localhost:8081/h2-console** (JDBC URL: `jdbc:h2:mem:ddadb`, user: `sa`, no password).

### Dev admin account (auto-created on every startup)

The `dev` profile seeds an admin user because the in-memory H2 database is wiped on each restart:

| Field | Default |
|-------|---------|
| Username | `admin` |
| Password | `admin123` |
| Email | `admin@localhost` |

Log in at `/shop/user-login.html` or register is not required for this account.

Override in `application.yml` under `app.admin` or with env vars: `DDA_ADMIN_USERNAME`, `DDA_ADMIN_PASSWORD`, `DDA_ADMIN_EMAIL`.

### Production bootstrap admin (optional)

On Railway (or any `prod` deploy), set these **only when** you need to create or recover an admin on an empty database:

```bash
DDA_ADMIN_SEED_ENABLED=true
DDA_ADMIN_USERNAME=admin
DDA_ADMIN_PASSWORD=your_secure_password
DDA_ADMIN_EMAIL=you@diegodeaduriz.art
```

Seeding runs only if no `ADMIN` user exists yet, or to promote the configured username to `ADMIN`. Remove `DDA_ADMIN_SEED_ENABLED` after the first successful deploy.

---

## Quick Start (Production with MySQL)

### 1. Create the MySQL database

```sql
CREATE DATABASE dda_art_shop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dda_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON dda_art_shop.* TO 'dda_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Set environment variables

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=dda_art_shop
export DB_USERNAME=dda_user
export DB_PASSWORD=your_secure_password
export JWT_SECRET=your-secret-key-at-least-256-bits-long-change-this
```

### 3. Run with the prod profile

```bash
cd dda-backend
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

Flyway will automatically create all tables and seed the 80 artworks on first run.

---

## API Guide

### Base URL

```
http://localhost:8081/api
```

---

### 1. Authentication

#### Register a new admin user

```bash
curl -X POST http://localhost:8081/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@diegodeaduriz.art",
    "password": "your_password"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "username": "admin",
  "role": "ADMIN"
}
```

#### Login

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "your_password"
  }'
```

**Response:** Same as register — save the `token` for authenticated requests.

#### Using the token

Add the token as a Bearer header to all admin requests:

```bash
-H "Authorization: Bearer eyJhbGciOiJIUzUxMiJ9..."
```

---

### 2. Artworks (Public — no auth needed)

#### List all artworks (paginated)

```bash
# Default: page 0, size 20, sorted by newest first
curl http://localhost:8081/api/artworks

# Custom pagination
curl "http://localhost:8081/api/artworks?page=0&size=10&sort=title,asc"
```

**Pagination parameters:**
| Param | Default | Description |
|-------|---------|-------------|
| `page` | 0 | Page number (0-indexed) |
| `size` | 20 | Items per page |
| `sort` | `createdAt,desc` | Sort field and direction |

**Sort options:** `title,asc` · `title,desc` · `createdAt,asc` · `createdAt,desc` · `price,asc` · `price,desc`

#### Get a single artwork by slug

```bash
curl http://localhost:8081/api/artworks/catastrofe-catarsis
```

#### Filter by category

```bash
curl http://localhost:8081/api/artworks/category/pasteles
curl http://localhost:8081/api/artworks/category/gatos
curl "http://localhost:8081/api/artworks/category/ilustraciones?size=5"
```

**Available categories:** `pasteles` (30) · `ilustraciones` (18) · `paisajes` (11) · `gatos` (6) · `digital` (4) · `Autorretratos` (4) · `simbolico` (3) · `obras` (2) · `texto` (1) · `paisaje` (1)

#### Search artworks

```bash
# Search by title, technique, or dimensions
curl "http://localhost:8081/api/artworks/search?q=gato"
curl "http://localhost:8081/api/artworks/search?q=acrílico"
curl "http://localhost:8081/api/artworks/search?q=52 x 52"
```

---

### 3. Artworks (Admin — requires JWT)

Save your token first:

```bash
TOKEN="eyJhbGciOiJIUzUxMiJ9..."
```

#### Create a new artwork

```bash
curl -X POST http://localhost:8081/api/artworks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Nueva Obra",
    "description": "Descripción de la obra",
    "price": "Consultar",
    "dimensions": "40 x 30 cm",
    "technique": "Óleo sobre tela",
    "year": "2025",
    "sold": false,
    "category": "pasteles"
  }'
```

#### Update an artwork

```bash
curl -X PUT http://localhost:8081/api/artworks/81 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Nueva Obra (Actualizada)",
    "description": "Nueva descripción",
    "price": "$500 USD",
    "dimensions": "40 x 30 cm",
    "technique": "Óleo sobre tela",
    "year": "2025",
    "sold": false,
    "category": "pasteles"
  }'
```

#### Toggle sold status

```bash
curl -X PATCH http://localhost:8081/api/artworks/1/sold \
  -H "Authorization: Bearer $TOKEN"
```

#### Delete an artwork

```bash
curl -X DELETE http://localhost:8081/api/artworks/81 \
  -H "Authorization: Bearer $TOKEN"
```

---

### 4. Categories

#### List all categories (with artwork counts)

```bash
curl http://localhost:8081/api/categories
```

**Response:**
```json
[
  { "id": 1, "name": "pasteles", "displayName": "Pasteles", "artworkCount": 30 },
  { "id": 2, "name": "ilustraciones", "displayName": "Ilustraciones", "artworkCount": 18 },
  ...
]
```

#### Create a new category (admin)

```bash
curl -X POST http://localhost:8081/api/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "name": "murales", "displayName": "Murales" }'
```

#### Update a category (admin)

```bash
curl -X PUT http://localhost:8081/api/categories/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{ "name": "pasteles", "displayName": "Pasteles y Tizas" }'
```

---

### 5. Image Upload (Admin)

#### Upload an image to an artwork

```bash
curl -X POST http://localhost:8081/api/artworks/1/images \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/your/image.jpg" \
  -F "primary=true"
```

**Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `file` | Yes | The image file (JPEG, PNG, WebP, GIF) |
| `primary` | No | Set as primary display image (`true`/`false`, default `false`) |

#### Delete an image

```bash
curl -X DELETE http://localhost:8081/api/images/1 \
  -H "Authorization: Bearer $TOKEN"
```

---

## Project Structure

```
dda-backend/
├── pom.xml                          # Maven dependencies
├── Dockerfile                       # Multi-stage Docker build
├── src/main/java/com/dda/
│   ├── DdaApplication.java          # Entry point
│   ├── config/
│   │   ├── SecurityConfig.java      # Spring Security + JWT filter chain
│   │   └── CorsConfig.java          # CORS for frontend origins
│   ├── controller/
│   │   ├── AuthController.java      # Login / Register
│   │   ├── ArtworkController.java   # Artworks CRUD + search
│   │   ├── CategoryController.java  # Categories CRUD
│   │   └── ImageController.java     # Image upload/delete
│   ├── dto/                         # Request/Response objects
│   ├── entity/                      # JPA entities (User, Artwork, Category, ArtworkImage)
│   ├── repository/                  # Spring Data JPA repositories
│   ├── service/                     # Business logic
│   ├── security/                    # JWT token provider + filter
│   └── exception/                   # Global error handling
└── src/main/resources/
    ├── application.yml              # Configuration (dev + prod profiles)
    └── db/migration/                # Flyway SQL migrations
        ├── V1__create_users.sql
        ├── V2__create_categories.sql
        ├── V3__create_artworks.sql
        └── V4__seed_artworks.sql    # Seeds 80 products
```

---

## Docker

### Build and run with Docker

```bash
cd dda-backend

# Build the image
docker build -t dda-backend .

# Run with H2 (dev)
docker run -p 8081:8081 dda-backend

# Run with MySQL (prod)
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

---

## Common Issues

### IntelliJ shows "Cannot resolve method" errors
Right-click `pom.xml` → **Maven** → **Reload Project**. If that doesn't work: **File → Invalidate Caches → Invalidate and Restart**.

### "Table not found" on startup
Make sure Flyway migrations are running. Check the console for `Migrating schema "PUBLIC" to version` messages. If using MySQL, ensure the database exists and credentials are correct.

### JWT token expired
Tokens expire after 24 hours. Call `/api/auth/login` again to get a new one.

### Image upload fails
Check that the file type is one of: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. Max file size is 10MB.
