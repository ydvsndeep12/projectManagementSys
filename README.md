# TaskFlow — Team Task Manager

A full-stack MERN application for managing projects, teams, and tasks with role-based access control.

## Tech Stack

- **Backend**: Node.js · Express · MongoDB (Mongoose) · JWT
- **Frontend**: React (Vite) · React Router v6 · Axios

## Features

- **Authentication** — Register / Login with JWT (7-day tokens)
- **Role-based access** — Admin can create/edit/delete projects & tasks; Members can update their task status
- **Project management** — Create projects, add/remove team members
- **Task management** — Create tasks with title, description, assignee, priority, status, due date
- **Kanban board** — Tasks organized in To Do / In Progress / Done columns
- **Dashboard** — Stats overview, my tasks, overdue alerts

## Color Palette

| Token | Hex |
|-------|-----|
| Primary | `#355872` |
| Secondary | `#7AAACE` |
| Background | `#F7F8F0` |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas cluster (or local MongoDB)

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd Assignment
```

### 2. Backend setup

```bash
cd server
npm install
```

Edit `server/.env`:

```
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/team-task-manager
JWT_SECRET=a_long_random_secret_string
PORT=5000
NODE_ENV=development
```

Start the server:

```bash
npm run dev      # development (nodemon)
npm start        # production
```

### 3. Frontend setup

```bash
cd ../client
npm install
npm run dev
```

The React app runs on **http://localhost:5173** and proxies `/api` to the Express server on port 5000.

---

## API Endpoints

### Auth
| Method | Route | Access |
|--------|-------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET  | `/api/auth/me` | Auth |

### Projects
| Method | Route | Access |
|--------|-------|--------|
| GET    | `/api/projects` | Auth |
| POST   | `/api/projects` | Admin |
| GET    | `/api/projects/:id` | Member |
| PUT    | `/api/projects/:id` | Admin (owner) |
| DELETE | `/api/projects/:id` | Admin (owner) |
| POST   | `/api/projects/:id/members` | Admin (owner) |
| DELETE | `/api/projects/:id/members/:userId` | Admin (owner) |

### Tasks
| Method | Route | Access |
|--------|-------|--------|
| GET    | `/api/tasks` | Auth |
| POST   | `/api/tasks` | Admin |
| GET    | `/api/tasks/:id` | Auth |
| PUT    | `/api/tasks/:id` | Admin (all fields) / Assigned member (status only) |
| DELETE | `/api/tasks/:id` | Admin |

### Users
| Method | Route | Access |
|--------|-------|--------|
| GET    | `/api/users` | Auth |

---

## Deployment (Railway)

1. Push the repo to GitHub.
2. On Railway, create **two services**:

   **Service 1 — Backend**
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
   - Add env vars: `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `PORT`

   **Service 2 — Frontend**
   - Root directory: `client`
   - Build command: `npm install && npm run build`
   - Start command: `npx serve dist`
   - Add env var: `VITE_API_URL=https://<your-backend-url>/api`

   Or deploy as a single service by running `npm run build` in `client` first, then serving from `server` (which already serves `client/dist` in production mode).

---

## Roles

| Feature | Admin | Member |
|---------|-------|--------|
| Create project | ✅ | ❌ |
| Edit / delete project | ✅ (owner) | ❌ |
| Add / remove members | ✅ (owner) | ❌ |
| Create / edit / delete task | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks) |
| View projects & tasks | ✅ | ✅ |
