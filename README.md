<p align="center">
  <strong>🏡 NeighborNodes</strong>
</p>

<p align="center">
  <em>A location-aware community borrowing platform — borrow what you need, lend what you don't use.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18+-339933?logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-v5-000000?logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Leaflet.js-Maps-199900?logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/License-ISC-blue" alt="License" />
</p>

---

## 📌 What is NeighborNodes?

**NeighborNodes** is a full-stack web application that lets people within the same neighborhood **borrow and lend** rarely-used household items — think power drills, projectors, camping tents, or kitchen appliances.

### The Problem

> Many expensive household items sit idle 99% of the time. You buy a ₹15,000 drill for one weekend project, a ₹50,000 projector for two movie nights a year, or a camping tent that collects dust in your closet. Meanwhile, your neighbor three streets away just bought the exact same thing.

### The Solution

NeighborNodes connects neighbors within the **same pincode** into a trusted sharing community. Instead of buying, you borrow. Instead of hoarding, you lend — and earn.

**In simple terms:** It's like a neighborhood library, but for everything.

---

## ✨ Key Features

| Feature | What it Does | Why it Matters |
|---------|-------------|----------------|
| 🗺️ **Community Map** | Interactive Leaflet.js map showing available items near you | Visual discovery — see what's available at a glance |
| 📍 **Pincode-Based Communities** | Items are filtered by pincode — you only see what's in your area | Ensures items are within walking/short-driving distance |
| 🔐 **Privacy-First Addresses** | Exact addresses are hidden until a borrow request is **accepted** | Protects user safety; only approximate locality shown on map |
| 🔄 **Full Borrow Lifecycle** | `Pending → Accepted → Collected → Returned` with status tracking | Both parties always know where things stand |
| 🛡️ **Race Condition Prevention** | PostgreSQL row-level locking (`SELECT ... FOR UPDATE`) on borrow/accept | Two people can't accidentally borrow the same item simultaneously |
| 🤖 **AI Assistant Chatbot** | Keyword-driven chatbot that helps find items and answers FAQs | Guided discovery without manual browsing |
| 🔔 **Notification Badges** | Dashboard badge showing pending incoming + outgoing request count | Never miss a borrow request |
| 📝 **Contact & Feedback** | Structured feedback form with category tagging | Users can report issues, suggest features, or reach out |
| 🔑 **JWT Authentication** | Secure login/signup with bcrypt password hashing and JWT tokens | Industry-standard auth — sessions survive page reloads |
| 📦 **7 Item Categories** | Utility Tools, Hardware, Electronics, Camping, Gaming, Home Appliances, Kitchen | Organized browsing with emoji-tagged category bar |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│  Vanilla HTML/CSS/JS • Leaflet.js Maps • No build step      │
│                                                             │
│  index.html ─── Landing page + Map + Item grid              │
│  auth.html ──── Login / Signup with pincode registration    │
│  Dashboard.html  Lender + Borrower request management       │
│  Borrow.html ── Item detail + date picker + reservation     │
│  ListItem.html ─ Form to post new item listings             │
│  Contact.html ── Feedback/support form                      │
│  script.js ───── All frontend logic (single shared file)    │
│  style.css ───── Complete design system (~50KB)             │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTP (REST API)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js + Express 5)           │
│                                                             │
│  server.js ─────── Entry point, middleware, route mounting  │
│  db.js ─────────── PostgreSQL connection pool (pg)          │
│                                                             │
│  Controllers/                                               │
│  ├── authController.js ────── Register (with pincode        │
│  │                            coords) + Login (JWT)         │
│  ├── borrowController.js ──── Create request, pickup        │
│  │                            address reveal, collect,      │
│  │                            return (with transactions)    │
│  ├── lenderController.js ──── CRUD items, accept/reject     │
│  │                            requests (row-level locking)  │
│  ├── locationController.js ── Nearby items by pincode       │
│  │                            with Haversine distances      │
│  ├── assistantController.js ─ Keyword-based AI chatbot      │
│  ├── contactController.js ─── Feedback submission + admin   │
│  └── itemController.js ────── General item queries          │
│                                                             │
│  Utils/                                                     │
│  ├── haversine.js ──── Distance calculation (km)            │
│  ├── pincodeMap.js ──── 100+ Mumbai/Pune pincode → lat/lng  │
│  └── geocode.js ─────── Geocoding helpers                   │
└──────────────────────┬──────────────────────────────────────┘
                       │  SQL (pg driver)
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     DATABASE (PostgreSQL)                   │
│                                                             │
│  users ─────────── id, name, email, phone, password,        │
│                    role, trust_score, locality, pincode,    │
│                    full_address, latitude, longitude        │
│                                                             │
│  items ─────────── id, owner_id (FK→users), item_name,      │
│                    description, category, price_per_day,    │
│                    status, image_url                        │
│                                                             │
│  borrow_requests ─ id, item_id (FK→items),                  │
│                    borrower_id (FK→users), start_date,      │
│                    end_date, total_price, request_status    │
│                                                             │
│  feedback ──────── id, user_id (FK→users), name, email,     │
│                    category, subject, message, status       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have these installed on your machine:

| Tool | Version | Download |
|------|---------|----------|
| **Node.js** | v18 or higher | [nodejs.org](https://nodejs.org/) |
| **PostgreSQL** | v14 or higher | [postgresql.org](https://www.postgresql.org/download/) |
| **Git** | Any recent version | [git-scm.com](https://git-scm.com/) |

> **💡 New to these tools?**
> - **Node.js** is the JavaScript runtime that powers the backend server.
> - **PostgreSQL** is the database where all data (users, items, requests) is stored.
> - **Git** is for cloning (downloading) this repository.

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Bhushan0455/NeighborNodes.git
cd NeighborNodes
```

### Step 2 — Set Up the Database

Open your PostgreSQL client (pgAdmin, psql CLI, or DBeaver) and run the SQL from `Database_Queries.sql`:

```sql
-- This creates 4 tables: users, items, borrow_requests, feedback
-- Open Database_Queries.sql and execute all CREATE TABLE statements
```

Then run the lifecycle migration to enable the full borrow status flow:

```sql
-- Open lifecycle_migration.sql and run it
-- This adds: pending, accepted, rejected, collected, returned
```

> **💡 Beginner tip:** If you're using pgAdmin, open the Query Tool (Tools → Query Tool), paste the SQL, and click the ▶ Execute button.

### Step 3 — Seed Sample Data (Optional)

The `Database_Queries.sql` file includes `INSERT INTO items (...)` statements with **42 sample items** across 7 categories (utility tools, hardware, electronics, camping, gaming, home appliances, kitchen) — all with real Unsplash image URLs. Run those inserts to populate your database with demo data.

### Step 4 — Configure Environment Variables

Create a `.env` file inside the `Backend/` folder:

```bash
cd Backend
```

Create the file `Backend/.env` with the following content:

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=neighbornodes
DB_PASSWORD=your_postgres_password
DB_PORT=5432
JWT_SECRET=your_secret_key_here
```

| Variable | What it is |
|----------|-----------|
| `DB_USER` | Your PostgreSQL username (default is `postgres`) |
| `DB_HOST` | Database host (`localhost` for local development) |
| `DB_NAME` | Name of the database you created in Step 2 |
| `DB_PASSWORD` | Your PostgreSQL password |
| `DB_PORT` | PostgreSQL port (default `5432`) |
| `JWT_SECRET` | Any random string — used to sign authentication tokens |

> **⚠️ Security:** The `.env` file is listed in `.gitignore` and will **never** be committed to Git. Do not share it publicly.

### Step 5 — Install Dependencies

```bash
cd Backend
npm install
```

This installs the following packages:

| Package | Purpose |
|---------|---------|
| `express` | Web server framework |
| `pg` | PostgreSQL client for Node.js |
| `bcrypt` | Password hashing (one-way encryption) |
| `jsonwebtoken` | JWT token generation and verification |
| `cors` | Cross-Origin Resource Sharing (lets the frontend talk to the backend) |
| `dotenv` | Loads `.env` variables into `process.env` |
| `nodemon` *(dev)* | Auto-restarts the server when you edit code |

### Step 6 — Start the Backend Server

```bash
npm start
```

You should see:

```
🚀 Server running on http://localhost:5000
```

To verify the database connection, open your browser and visit:

```
http://localhost:5000/
```

You should get a JSON response like:

```json
{
  "message": "NeighborNodes Backend is Live",
  "db_time": "2026-04-17T15:19:00.000Z"
}
```

### Step 7 — Open the Frontend

The frontend is plain HTML — no build step required. Simply open any `.html` file in your browser:

- **Option A (recommended):** Use the VS Code **Live Server** extension → right-click `Frontend/index.html` → "Open with Live Server"
- **Option B:** Double-click `Frontend/index.html` to open it directly in your browser

> **💡 Why Live Server?** It auto-reloads the page when you edit HTML/CSS/JS, and avoids some browser file:// restrictions with fetch requests.

---

## 📡 API Reference

All endpoints are prefixed with `http://localhost:5000/api`.

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | `{ name, email, phone, password, role, locality, pincode, address }` | Create a new user account. Pincode is validated against the supported pincode map. Coordinates are auto-assigned based on pincode center + random offset (~200m). |
| `POST` | `/api/auth/login` | `{ email, password }` | Authenticate and receive a JWT token + userId. |

### Items & Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/location/nearby/:userId` | Get all available items within the user's pincode, with map coordinates and distances. |
| `GET` | `/api/lender/items/:id` | Get a single item's details with owner info. |
| `GET` | `/api/items` | Get all items (general query). |

### Borrowing Lifecycle

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/borrow` | `{ item_id, borrower_id, start_date, end_date }` | Submit a borrow request (uses row-level locking). |
| `GET` | `/api/borrow/address/:requestId/:userId` | — | Get pickup address (only visible after request is accepted). |
| `PATCH` | `/api/borrow/:requestId/collect` | `{ borrower_id }` | Borrower marks item as physically collected. |
| `PATCH` | `/api/borrow/:requestId/return` | `{ borrower_id }` | Borrower marks item as returned (item becomes available again). |

### Lender Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/lender/my-items/:ownerId` | Get all items listed by a specific user. |
| `GET` | `/api/lender/dashboard/:userId` | Get all incoming borrow requests for the lender's items. |
| `POST` | `/api/lender/list-item` | Post a new item listing. |
| `PATCH` | `/api/lender/request/:requestId` | Accept or reject a borrow request (`{ status: "accepted" | "rejected" }`). |
| `DELETE` | `/api/lender/item/:itemId` | Delete an item listing. |

### Borrower Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/borrower/requests/:userId` | Get all borrow requests made by a specific user. |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications/count/:userId` | Get total pending request count (incoming + outgoing). |

### AI Assistant

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/assistant/chat` | `{ message }` | Send a message to the keyword-based chatbot. Returns category-matched items or FAQ responses. |

### Contact & Feedback

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/contact` | `{ name, email, category, subject, message, user_id }` | Submit feedback or contact message. |
| `GET` | `/api/contact/all` | — | Admin: retrieve all feedback entries. |

---

## 🗄️ Database Schema

### Entity Relationship

```
users (1) ──────< (N) items
  │                     │
  │                     │
  (1)                   (1)
  │                     │
  ▼                     ▼
  (N) borrow_requests (N)
  │
  (1)
  │
  ▼
  (N) feedback
```

### Borrow Request Lifecycle

```
    ┌──────────┐    Lender accepts     ┌──────────┐    Borrower picks up   ┌───────────┐
    │ PENDING  │ ──────────────────►   │ ACCEPTED │ ─────────────────────► │ COLLECTED │
    └──────────┘                       └──────────┘                        └───────────┘
         │                                                                       │
         │  Lender rejects                                      Borrower returns │
         ▼                                                                       ▼
    ┌──────────┐                                                          ┌──────────┐
    │ REJECTED │                                                          │ RETURNED │
    └──────────┘                                                          └──────────┘
                                                                     (item → available)

    * OVERDUE is computed dynamically: if status = 'collected' AND end_date < today
```

---

## 📂 Project Structure

```
NeighborNodes/
│
├── Frontend/                    # Client-side (no build tools needed)
│   ├── index.html               # Landing page — hero, map, item grid, chatbot
│   ├── auth.html                # Login / Signup with pincode + locality fields
│   ├── Dashboard.html           # Lender items, incoming requests, borrower requests
│   ├── Borrow.html              # Item detail page with date picker + reservation
│   ├── ListItem.html            # Form to post a new item for lending
│   ├── Contact.html             # Feedback / Contact Us form
│   ├── script.js                # All frontend JavaScript logic (~48KB)
│   └── style.css                # Complete design system (~50KB)
│
├── Backend/                     # Server-side (Node.js + Express)
│   ├── server.js                # Entry point — middleware, routes, notification endpoint
│   ├── db.js                    # PostgreSQL connection pool configuration
│   ├── package.json             # Dependencies and scripts
│   ├── .env                     # ⚠️ Not committed — database + JWT credentials
│   │
│   ├── Controller/              # Business logic (one file per domain)
│   │   ├── authController.js    # Register (pincode → coords) + Login (JWT)
│   │   ├── borrowController.js  # Create request, address reveal, collect, return
│   │   ├── lenderController.js  # Item CRUD, accept/reject with row-level locking
│   │   ├── locationController.js# Nearby items query with Haversine distance
│   │   ├── assistantController.js# Keyword-based AI chatbot
│   │   ├── contactController.js # Feedback submission + retrieval
│   │   └── itemController.js    # General item queries
│   │
│   ├── routes/                  # Express route definitions (thin layer)
│   │   ├── authRoutes.js
│   │   ├── borrowRoutes.js
│   │   ├── lenderRoutes.js
│   │   ├── locationRoutes.js
│   │   ├── assistantRoutes.js
│   │   ├── contactRoutes.js
│   │   └── itemRoutes.js
│   │
│   └── utils/                   # Shared helper functions
│       ├── haversine.js         # Haversine formula for distance (km) between coordinates
│       ├── pincodeMap.js        # 100+ Indian pincodes → { lat, lng, area } mapping
│       ├── geocode.js           # Geocoding utility functions
│       └── geocode-existing-users.js  # One-time migration script for existing user coords
│
├── Database_Queries.sql         # Full schema + 42 seed items across 7 categories
├── lifecycle_migration.sql      # Adds collected/returned statuses to borrow_requests
├── fix_user_coordinates.sql     # Migration to fix user lat/lng from pincode centers
├── .gitignore                   # Excludes .env, node_modules, logs, OS files
└── README.md                    # You are here
```

---

## 🔧 Technical Deep Dives

<details>
<summary><strong>🔒 How Race Conditions Are Prevented</strong></summary>

### The Problem

If two users click "Borrow" on the same item at the exact same millisecond, without protection, both requests could succeed — double-booking the item.

### The Solution

We use **PostgreSQL transactions with row-level locking** (`SELECT ... FOR UPDATE`):

```sql
BEGIN;
  SELECT id, status FROM items WHERE id = $1 FOR UPDATE;  -- Locks this specific row
  -- If another transaction tries to lock the same row, it BLOCKS here until we finish
  UPDATE items SET status = 'unavailable' WHERE id = $1;
  UPDATE borrow_requests SET request_status = 'accepted' WHERE id = $2;
COMMIT;
```

**What happens behind the scenes:**
1. Transaction A reaches `FOR UPDATE` first → acquires an exclusive lock on the item row.
2. Transaction B reaches the same query → **blocks** (waits).
3. Transaction A sets the item to `unavailable` and commits.
4. Transaction B unblocks, reads the updated row, sees `status = 'unavailable'`, and fails gracefully.

This pattern is used in both `borrowController.js` (creating requests) and `lenderController.js` (accepting requests).

</details>

<details>
<summary><strong>📍 How Pincode-Based Location Works</strong></summary>

### Registration Flow

1. User enters their pincode during signup (e.g., `400601` for Thane West).
2. Backend looks up the pincode in `pincodeMap.js` → gets center coordinates `{ lat: 19.1964, lng: 72.9631 }`.
3. A small **random offset** (~200m) is added so users in the same pincode don't stack on the exact same point.
4. Coordinates are stored in the `users` table.

### Item Discovery

1. When a user opens the home page, the frontend calls `/api/location/nearby/:userId`.
2. Backend reads the user's pincode → filters items to **only** those owned by users with the **same pincode**.
3. Each item is placed on the map using a **seeded random position** (deterministic based on item ID) within ~400m of the pincode center.
4. Distance from user to each item is calculated using the **Haversine formula** and returned for display.

### Privacy Model

- **Before request accepted:** Only approximate locality is shown (e.g., "Thane West"). Map shows scattered approximate positions.
- **After request accepted:** The borrower can call `/api/borrow/address/:requestId/:userId` to see the lender's full address, phone number, and item name.

</details>

<details>
<summary><strong>🤖 How the AI Assistant Works</strong></summary>

The chatbot in `assistantController.js` uses a **keyword-matching approach**:

1. User sends a message (e.g., "I need a drill for weekend").
2. Backend converts to lowercase and checks against category keyword maps:
   - `"drill"` matches `utility_tools` → queries available items in that category.
3. If no category matches, it checks for FAQ keywords (`"borrow"`, `"trust score"`, `"list item"`).
4. If nothing matches, it returns a fallback message with usage hints.

The chatbot **directly queries the database**, so it always returns real, currently-available items.

</details>

---

## 🛠️ Tech Stack

| Layer | Technology | Why this choice |
|-------|-----------|----------------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Zero build step — open and run. Fast iteration. |
| **Maps** | Leaflet.js + OpenStreetMap | Free, open-source, no API key needed. |
| **Backend** | Node.js + Express 5 | Lightweight, async-native, huge ecosystem. |
| **Database** | PostgreSQL | ACID transactions, row-level locking, robust for concurrent operations. |
| **Auth** | bcrypt + JWT | Industry-standard password hashing + stateless token-based sessions. |
| **DB Driver** | pg (node-postgres) | Direct SQL — no ORM overhead, full control over queries. |

---

## 🧪 Quick Verification Checklist

After setup, verify everything works by checking these endpoints:

| # | Test | Expected Result |
|---|------|----------------|
| 1 | Visit `http://localhost:5000/` | JSON with `"NeighborNodes Backend is Live"` |
| 2 | Open `Frontend/index.html` in browser | Landing page loads with hero, category bar, and map |
| 3 | Sign up with a supported pincode (e.g., `400601`) | Account created, redirected to explore page |
| 4 | Check the dashboard after login | Shows "Items Listed", "Pending Requests", "Items Borrowed" stats |
| 5 | Click any item → Reserve with dates | Borrow request created, visible on dashboard |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **ISC License**.

---

<p align="center">
  Built with 💚 for communities — <strong>NeighborNodes</strong>
</p>
