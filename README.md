# Merchant Onboarding Frontend

Angular 19 frontend for the Merchant Onboarding Platform — a banking system for managing merchant onboarding workflows with role-based dashboards, document uploads, real-time notifications, and compliance tracking.

## Tech Stack

- **Angular 19** (standalone components)
- **TypeScript 5.7**
- **STOMP over WebSocket** (real-time notifications)
- **RxJS** (reactive state management)

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ (LTS recommended) |
| npm | 9+ |
| Angular CLI | 19+ *(installed automatically via npx)* |

> **The backend must be running** before using this frontend. See the [backend repository](https://github.com/sp00kers/merchant-onboarding-backend) for setup instructions.

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/sp00kers/merchant-onboarding.git
cd merchant-onboarding
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm start
```

The app starts at **http://localhost:4200** and connects to the backend at `http://localhost:8080/api`.

### 4. Log in

Use one of the default accounts (password: `password123`):

| Email | Role |
|-------|------|
| `john.doe@bank.com` | Onboarding Officer |
| `jane.smith@bank.com` | Compliance Reviewer |
| `sarah.lee@bank.com` | System Administrator |

## Environment Configuration

API URL is configured in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};
```

Change `apiUrl` if your backend runs on a different host or port.

## Project Structure

```
src/app/
├── components/        # Shared components (navbar, notifications)
├── pages/             # Page-level components (dashboard, cases, etc.)
├── services/          # API and auth services
├── guards/            # Route guards (auth, role-based)
├── interceptors/      # HTTP interceptors (JWT token injection)
├── models/            # TypeScript interfaces and types
src/environments/      # Environment config (dev/prod API URLs)
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server at `localhost:4200` |
| `npm run build` | Production build to `dist/` |
| `npm test` | Run unit tests via Karma |
| `npm run watch` | Build in watch mode |

## Full Platform Setup (Quick Reference)

To run the complete platform locally:

1. **Start MySQL** — ensure it's running on port `3306`
2. **Start Kafka stack** — in the backend repo: `docker compose up -d`
3. **Start backend** — in the backend repo: `./mvnw spring-boot:run`
4. **Start frontend** — in this repo: `npm start`
5. **Open browser** — navigate to `http://localhost:4200`
