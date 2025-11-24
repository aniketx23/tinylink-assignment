# TinyLink – URL Shortener Take-Home Assignment

TinyLink is a minimal URL shortener web app similar to bit.ly.  
It lets users create short links, track click statistics, and manage links via a clean dashboard.

This project was built as a take-home assignment and follows the given spec:
- Shorten long URLs with optional custom codes
- Redirect `/:code` to the target URL
- Track total clicks and last clicked time
- Provide a dashboard and a per-link stats page
- Expose REST APIs for links and a `/healthz` endpoint

---

## 🔗 Live Demo

**Deployed app:**  
**URL**: https://tinylink-assignment-eight.vercel.app/

---

## 🧰 Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS 
- **Database:** PostgreSQL 
- **ORM:** Prisma
- **Deployment:** Vercel 

---

## ✨ Core Features

- **Create short links**
  - Input long URL + optional custom code
  - Validate URL before saving
  - Enforce code pattern: `[A-Za-z0-9]{6,8}`
  - Return `409` if a custom code already exists

- **Redirect**
  - `GET /:code` → HTTP 302 redirect to target URL
  - On each redirect:
    - Increment `totalClicks`
    - Update `lastClickedAt`

- **Delete links**
  - Delete from dashboard
  - After deletion: `/:code` returns `404` and no longer redirects

- **Dashboard (`/`)**
  - Table of all links:
    - Short code
    - Target URL (truncated with ellipsis)
    - Total clicks
    - Last clicked time
  - Actions:
    - Add new link (with optional custom code)
    - Delete link
  - Optional search/filter by code or URL
  - Copy-to-clipboard button for the short URL

- **Stats page (`/code/:code`)**
  - Show details for a single link
  - Includes target URL, total clicks, last clicked time, etc.

- **Healthcheck (`/healthz`)**
  - Returns `200` with JSON, e.g.:
    ```json
    { "ok": true, "version": "1.0" }
    ```

---

## 🏗 Project Structure

> Adjust paths if your structure is slightly different.

```text
src/
  app/
    page.tsx            # Dashboard (list/add/delete links)
    healthz/route.ts    # /healthz endpoint
    [code]/page.tsx     # Stats page for /code/:code
    api/
      links/route.ts        # POST /api/links, GET /api/links
      links/[code]/route.ts # GET /api/links/:code, DELETE /api/links/:code
  lib/
    db.ts               # Database client (Prisma)
    links.ts            # Link-related helper functions
prisma/
  schema.prisma         # Prisma schema (Link model)
.env.example            # Example environment variables
