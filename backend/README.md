# ExpenseApp backend (MongoDB)

## What this folder is

- **MongoDB** stores documents (like JSON objects) in **collections** (like tables).
- **Mongoose** is the library that defines **schemas** (shape of each document) and talks to MongoDB from Node.js.

Milestone **1 — Users** includes:

- `src/models/User.js` — email + `passwordHash` (no plain passwords).
- `src/services/userService.js` — `createUser`, `findUserByEmail`.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- MongoDB running locally **or** a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

## Setup

```bash
cd backend
cp .env.example .env
# Edit .env — set MONGODB_URI
npm install
```

### Local MongoDB URI example

```env
MONGODB_URI=mongodb://127.0.0.1:27017/expenseapp
```

The database name here is `expenseapp` (Mongo creates it on first write).

## Commands

| Command | Purpose |
|--------|---------|
| `npm start` | Start **HTTP API** on `PORT` (default **4000**); requires `JWT_ACCESS_SECRET` in `.env` |
| `npm run seed:user` | Legacy demo user (**cannot log in** until you bcrypt the password — prefer **Sign up** in the app) |

### “I don’t see data in Atlas”

1. **`npm start` alone never inserts data.** Run `npm run seed:user` at least once.
2. **Local vs Atlas:** If `MONGODB_URI` uses `127.0.0.1` or `localhost`, data is on **your computer**, not in **MongoDB Atlas** Data Explorer. Paste your Atlas connection string into `backend/.env` (with your password) to use Atlas.
3. **Database name** is the path segment in the URI, e.g. `...mongodb.net/expenseapp?...` → database **`expenseapp`**. It appears after the first write.
4. **Collection name:** Mongoose uses **`users`** (lowercase plural of model `User`).

## Auth (JWT + refresh tokens)

- **Access token:** short-lived JWT (`Authorization: Bearer …`), expiry `ACCESS_TOKEN_EXPIRES` (default `15m`).
- **Refresh token:** long random string; only **SHA-256 hash** is stored in MongoDB collection **`refreshtokens`**. Plain refresh is returned once to the client.
- **Rotation:** `POST /auth/refresh` with `{ refreshToken }` **deletes** the old refresh row and issues **new** access + refresh (reuse detection / tighter security).
- **Logout:** `POST /auth/logout` with `{ refreshToken }` revokes that session.

| Method | Path | Body / header |
|--------|------|----------------|
| POST | `/auth/register` | `{ email, password }` |
| POST | `/auth/login` | `{ email, password }` |
| POST | `/auth/refresh` | `{ refreshToken }` |
| POST | `/auth/logout` | `{ refreshToken }` |
| GET | `/auth/me` | `Authorization: Bearer <access>` |

Frontend: set `VITE_API_BASE_URL=http://localhost:4000`, store `token` + `refreshToken`, axios interceptor refreshes on **401**.

## Transactions (authenticated)

All routes require `Authorization: Bearer <access token>`.

| Method | Path | Body |
|--------|------|------|
| GET | `/transactions` | — |
| POST | `/transactions` | `{ type, amount, category, description?, date }` (`type`: `income` \| `expense`) |
| DELETE | `/transactions/:id` | — |

Amounts are stored in **book currency** (same convention as the frontend: USD in the model today).

## Next milestones

- Optional: pagination / filters on `GET /transactions`.
