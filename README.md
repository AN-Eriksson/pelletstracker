# PelletTracker

Status: In progress (work in progress)

PelletTracker is a small application to record and visualize household pellet consumption over time. You log how many sacks you fill each day, and the app shows statistics and charts to help monitor consumption trends and plan deliveries.

## Key features
- Log pellet usage per day (date, number of sacks). Logging again for the same date adds to that day's total.
- Quick entry with 1–4 sack shortcuts and "Idag / Igår" (today / yesterday) date shortcuts.
- Edit or delete earlier entries from the list of recent entries.
- Statistics: this week's total and averages over the last 30, 14, 7 and 3 days.
- Consumption chart: sacks per week or per day, with a rolling average and a 30 days / 3 months / all time range.
- Login with JWT; each user only sees their own entries.

## Tech stack
- Backend: Java 21, Spring Boot 3.5 (Spring Security, Spring Data JPA)
- Database: PostgreSQL 17
- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Chart.js
- Build: Gradle (backend), npm (frontend)
- Containerization: Docker, Docker Compose

## Running locally

All commands are run from this directory unless noted. Configuration is read from a `.env` file (see [Configuration](#configuration)); both Docker Compose and Spring Boot pick it up automatically.

### Option 1: Everything in Docker

```sh
docker compose up --build
```

Starts PostgreSQL and the app. Open http://localhost:3000 and log in with the bootstrap user from `.env`.

The Docker image serves the frontend build that is committed in `src/main/resources/static/`. If you changed the frontend, run `npm run build` in `frontend/` first.

### Option 2: Local development with hot reload

```sh
# 1. Database
docker compose up -d postgres

# 2. Backend (terminal 1), runs on :3000
./gradlew bootRun

# 3. Frontend (terminal 2), runs on :5173
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Vite reloads the frontend instantly and forwards `/api` and `/auth` to the backend. The backend restarts automatically (Spring Boot DevTools) when classes are recompiled, e.g. via Build in IntelliJ.

If the full stack is already running in Docker, stop the app container first (`docker compose stop app`) so port 3000 is free.

### Building the frontend

```sh
cd frontend
npm run build
```

Writes the production build to `src/main/resources/static/`, where Spring Boot serves it. The build output is checked in, so rebuild and commit it together with frontend changes.

## Configuration

Create a `.env` file in this directory (it is gitignored):

| Variable | Description |
|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Database created by the Postgres container |
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | Database connection for the app. Use `localhost:5432` for local runs; Docker Compose overrides the host. |
| `CORS_ALLOWED_ORIGINS` | **Required.** Comma-separated allowed origins, e.g. `http://localhost:3000,http://localhost:5173` |
| `SERVER_PORT` | Port the app listens on (default `3000`) |
| `JWT_SECRET` | Secret used to sign login tokens; set a long random value |
| `JWT_EXP_MS` | Token lifetime in milliseconds (default `3600000`, 1 hour) |
| `APP_BOOTSTRAP_USERNAME`, `APP_BOOTSTRAP_PASSWORD`, `APP_BOOTSTRAP_ROLE` | User created on startup if it doesn't exist. There is no registration yet, so this is how users are created. |

The database schema is created and updated automatically by Hibernate.

## API

All `/api/pellets` endpoints require `Authorization: Bearer <token>` and only operate on the logged-in user's entries. Responses are wrapped as `{ status, message, data }`.

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/login` | Log in with `{ username, password }`, returns `{ token }` |
| `GET` | `/api/pellets` | All entries |
| `POST` | `/api/pellets` | Add `{ date, numberOfSacks }`; adds to the existing entry if the date already has one |
| `GET` | `/api/pellets/{id}` | One entry |
| `PUT` | `/api/pellets/{id}` | Update an entry |
| `DELETE` | `/api/pellets/{id}` | Delete an entry |
| `GET` | `/api/pellets/count` | Number of entries |
| `GET` | `/api/pellets/weeks/{year}/{week}/total` | Total sacks for an ISO week |

## Tests

```sh
./gradlew test
```

`ApplicationTests` starts the full application and needs a running PostgreSQL plus the environment variables above. `PelletControllerTest` is a plain unit test and runs on its own:

```sh
./gradlew test --tests 'me.andreaseriksson.pelletstracker.pellet.PelletControllerTest'
```

## Coming functionality / To be implemented
- Frontend:
    - Show error messages in the UI when saving fails.
    - Convert the remaining JavaScript (`ApiClient.js`) to TypeScript.
    - User account pages and preferences.
- Backend:
    - User registration and password change.
    - Return 401 instead of 500 for a wrong password.
    - Pagination and filtering for large data sets.
    - CSV import/export.
    - Rate limiting and basic abuse protection.
    - Database migrations (e.g. Flyway) instead of automatic schema updates.
- CI/CD:
    - GitHub Actions workflow to build and deploy the container image.
- Tests:
    - More unit and integration tests for backend and frontend.
    - End-to-end tests for critical flows.

## Contributing
Contributions and bug reports are welcome. Open an issue or submit a pull request.

## License
MIT
