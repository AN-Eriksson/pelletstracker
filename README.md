# PelletTracker

PelletTracker keeps track of a household's pellet heating: how much is used, how much is left in stock and when it is time to order more. You log the pellets you take from the stock, in sacks or kg, and the app shows statistics, a consumption chart over several years, a refill forecast and how consumption relates to the outdoor temperature.

The interface is in Swedish and built mobile first.

## Features

- **Log consumption** per day in sacks (16 kg) or kg, with "Idag / Igår" date shortcuts. Logging again for the same date adds to that day's total.
- **Edit or delete** earlier entries from the list of recent entries.
- **Statistics:** this week's total and the average per day over the last 30, 14, 7 and 3 days.
- **Consumption chart:** one bar per day, week or month, with a rolling average and the mean outdoor temperature on a second axis. The period is 30 days, 3 months, 1 year or all time; the x-axis shows the year, so several heating seasons can be compared.
- **Stock:** log deliveries (pellets added to the stock). The balance is all deliveries minus consumption since the first delivery, and the forecast estimates when the stock runs out from the average daily consumption over the last 30 days.
- **Weather:** pick an SMHI weather station, and the app fetches the daily mean temperature (SMHI Open Data, no API key) from your first entry onwards and refreshes it every morning. It shows degree days (base 17 °C) and kg per degree day, so periods with different weather can be compared.
- **Login with server-side sessions;** each user only sees their own data. Clear Swedish error messages when something fails, with a retry where it makes sense.

## Tech stack

- Backend: Java 21, Spring Boot 3.5 (Spring Security, Spring Session JDBC, Spring Data JPA, Flyway)
- Database: PostgreSQL 17
- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Chart.js
- Build: Gradle (backend), npm (frontend)
- Deployment: Docker image on GitHub Container Registry, Docker Compose, GitHub Actions

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

Local development runs over plain http, so set `SESSION_COOKIE_SECURE=false` in `.env`, or the browser drops the session cookie and every login ends in "logged out".

If the full stack is already running in Docker, stop the app container first (`docker compose stop app`) so port 3000 is free.

### Building the frontend

```sh
cd frontend
npm run build
```

Writes the production build to `src/main/resources/static/`, where Spring Boot serves it. The build output is checked in, so rebuild and commit it together with frontend changes.

Other frontend scripts: `npm run lint` (ESLint, currently only `.js`/`.jsx` files) and `npm run format` (Prettier).

## Configuration

Create a `.env` file in this directory (it is gitignored):

| Variable | Description |
|---|---|
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Database created by the Postgres container |
| `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD` | Database connection for the app. Defaults to a local `pelletstracker` database on `localhost:5432`; Docker Compose overrides the host. |
| `CORS_ALLOWED_ORIGINS` | **Required.** Comma-separated allowed origins, e.g. `http://localhost:3000,http://localhost:5173` |
| `SERVER_PORT` | Port the app listens on (default `3000`) |
| `SESSION_TIMEOUT` | Idle time before a user is logged out (default `30d`) |
| `SESSION_COOKIE_SECURE` | Send the session cookie over HTTPS only (default `true`). Set `false` for local plain-http use. |
| `APP_BOOTSTRAP_USERNAME`, `APP_BOOTSTRAP_PASSWORD`, `APP_BOOTSTRAP_ROLE` | User created on startup if it doesn't exist. There is no registration, so this is how users are created. |

### Database schema

The schema is managed by Flyway migrations in `src/main/resources/db/migration/` and applied on startup. Hibernate only validates that the entities match it. Every entity change needs a new `V<n>__description.sql` file; never edit a migration that has already run.

## Authentication

- `POST /auth/login` checks the username and password and starts a session. The session lives in PostgreSQL (Spring Session JDBC) and the browser gets an `HttpOnly`, `SameSite=Lax` cookie, `pelletstracker_session`. There are no tokens in the frontend.
- `GET /auth/me` returns `{ username }` for a logged-in session, otherwise 401. The frontend asks it on start to decide between the login screen and the app.
- `POST /auth/logout` ends the session (204).
- CSRF protection is on: the server sets a readable `XSRF-TOKEN` cookie, and every `POST`, `PUT` and `DELETE` must send its value in the `X-XSRF-TOKEN` header. Without it the request gets 403.

## API

All `/api/**` endpoints require a logged-in session and only operate on the current user's data. Successful responses are wrapped as `{ status, message, data }`; errors as `{ timestamp, status, error, message, path, details }`. Amounts are always whole kilograms; sacks exist only in the frontend.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/pellets` | All consumption entries |
| `POST` | `/api/pellets` | Add `{ date, amountKg }`; adds to the existing entry if the date already has one |
| `GET` | `/api/pellets/{id}` | One entry |
| `PUT` | `/api/pellets/{id}` | Update an entry (409 if another entry already has the new date) |
| `DELETE` | `/api/pellets/{id}` | Delete an entry |
| `GET` | `/api/pellets/count` | Number of entries |
| `GET` | `/api/pellets/weeks/{year}/{week}/total` | Total kg for an ISO week |
| `GET` | `/api/deliveries` | All deliveries |
| `POST` | `/api/deliveries` | Add a delivery `{ date, amountKg }`; several per date are allowed |
| `PUT` | `/api/deliveries/{id}` | Update a delivery |
| `DELETE` | `/api/deliveries/{id}` | Delete a delivery |
| `GET` | `/api/weather/stations` | Active SMHI stations for daily mean temperature |
| `GET` | `/api/weather/settings` | The user's chosen station |
| `PUT` | `/api/weather/station` | Choose a station `{ stationId }`; imports temperatures from the first entry onwards |
| `GET` | `/api/weather/temperatures` | Daily mean temperatures for the chosen station |

If SMHI cannot be reached, the weather endpoints answer 502.

## Importing old data

`scripts/import_numbers_csv.py` imports a consumption log kept in a spreadsheet (exported from Apple Numbers as CSV: date `YYYY-MM-DD`, number of sacks). It only needs `python3` and prints SQL for `psql`. Days that already have an entry get the sheet's value, and everything runs in one transaction. Put the CSV in `import/`, which git ignores.

```sh
# Try it first: shows how many days are new, overwritten and unchanged, then rolls back
python3 scripts/import_numbers_csv.py import/log.csv --user <username> --dry-run \
  | docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

# Then for real: the same without --dry-run
```

On the server, copy the CSV and the script there with `scp` and run the same commands from the app folder. Take a backup first (`pg_dump`). After importing old data, pick the weather station again so temperatures are fetched from the first entry.

## Tests

```sh
./gradlew test
```

- `PelletControllerTest` and `DeliveryControllerTest` are plain unit tests with mocked repositories.
- `SessionAuthTest` runs the real security filter chain with MockMvc: login, sessions, CSRF, logout and that a deleted user is logged out.
- `SmhiParserTest` covers parsing of SMHI's JSON and CSV formats.
- `ApplicationTests` starts the full application and needs a running PostgreSQL plus the environment variables above.

Run a single test class with:

```sh
./gradlew test --tests 'me.andreaseriksson.pelletstracker.pellet.PelletControllerTest'
```

There are no frontend tests yet.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yaml`:

1. Builds an ARM Docker image and pushes it to `ghcr.io/an-eriksson/pelletstracker` (`latest` and the commit SHA).
2. Connects to the server over SSH through Cloudflare Access, copies `compose.prod.yaml` to `~/apps/pellettracker/compose.yaml` and runs `docker compose pull` and `docker compose up -d`.

The server keeps its own `.env` next to `compose.yaml`. The app listens on `127.0.0.1:8081` only and is reached from the internet through a Cloudflare Tunnel, which also handles HTTPS.

The image does not build the frontend; it uses the committed build in `src/main/resources/static/`.

## Ideas for later

- Stock counts, so the balance can be corrected against what is actually in the store.
- Price per delivery, for the cost per heating season.
- Comparison between heating seasons (kg, degree days and kg per degree day).
- Stock forecast based on the weather forecast.
- Lockout after repeated failed logins in the app (rate limiting is done in Cloudflare today).
- Password change and user administration.
- Convert `ApiClient.js` to TypeScript, lint `.ts`/`.tsx` files and add frontend tests.

## License

MIT
