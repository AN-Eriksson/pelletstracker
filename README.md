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
- **Log in with GitHub;** the first login creates an account, so there are no passwords to keep. Server-side sessions, and each user only sees their own data. Clear Swedish error messages when something fails, with a retry where it makes sense.

## Tech stack

- Backend: Java 21, Spring Boot 3.5 (Spring Security with OAuth2 login, Spring Session JDBC, Spring Data JPA, Flyway)
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

Starts PostgreSQL and the app. Open http://localhost:3000 and log in with the bootstrap user from `.env` (needs `PASSWORD_LOGIN_ENABLED=true`).

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

Locally you normally log in with the bootstrap user: set `PASSWORD_LOGIN_ENABLED=true` and `APP_BOOTSTRAP_*` in `.env`. To try the GitHub login locally as well, register a second OAuth app on GitHub for development (see [Authentication](#authentication)) and put its keys in the local `.env`. It works through Vite on http://localhost:5173 only, since that is the callback URL the dev app is registered with.

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
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | The GitHub OAuth app. Without a client id the GitHub button is hidden. |
| `REGISTRATION_DAILY_LIMIT` | Most new accounts (first GitHub logins) per 24 hours (default `10`) |
| `PASSWORD_LOGIN_ENABLED` | Allow login with username and password (default `false`). For local development with the bootstrap user. |
| `APP_BOOTSTRAP_USERNAME`, `APP_BOOTSTRAP_PASSWORD`, `APP_BOOTSTRAP_ROLE` | Password user created on startup if it doesn't exist. For local development; leave out in production. |

### Database schema

The schema is managed by Flyway migrations in `src/main/resources/db/migration/` and applied on startup. Hibernate only validates that the entities match it. Every entity change needs a new `V<n>__description.sql` file; never edit a migration that has already run.

## Authentication

Users log in with GitHub. The first GitHub login creates an account, so registration is open to anyone with a GitHub account, capped by `REGISTRATION_DAILY_LIMIT`. The account is tied to GitHub's numeric user id, not the username, which can change. The app only asks for the public profile (`read:user`), never e-mail, and keeps nothing from GitHub but the current username, which is shown in the app.

Setting up GitHub login:

1. On GitHub: Settings → Developer settings → OAuth Apps → New OAuth App. Homepage URL is the app's address, the callback URL `<address>/login/oauth2/code/github`. Generate a client secret.
2. Put `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in `.env` and restart.

A GitHub OAuth app has a single callback URL, so production and local development need one app each (the local one with `http://localhost:5173`).

- `GET /oauth2/authorization/github` sends the browser to GitHub; GitHub sends it back to `/login/oauth2/code/github`, which starts the session and redirects to `/`. A failed login redirects to `/?login=avbruten` (declined on GitHub), `/?login=fullt` (daily limit reached) or `/?login=fel`.
- `GET /auth/config` tells the login screen what to show: `{ passwordLogin, github }`.
- `POST /auth/login` checks a username and password and starts a session; only when `PASSWORD_LOGIN_ENABLED=true`, otherwise 404. The session lives in PostgreSQL (Spring Session JDBC) and the browser gets an `HttpOnly`, `SameSite=Lax` cookie, `pelletstracker_session`. There are no tokens in the frontend.
- `GET /auth/me` returns `{ username, displayName }` for a logged-in session, otherwise 401. `displayName` is the current GitHub username, or the username for password users. The frontend asks it on start to decide between the login screen and the app.
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

`--user` is the app's username. For a GitHub user it is the GitHub username at the first login, with `-2` etc. if it was taken.

### Moving data from a password account to a GitHub account

When switching from the bootstrap user to GitHub login: log in with GitHub once, so the new account exists, but log nothing there. Then take a backup and move everything (consumption, deliveries, weather station and role) from the old account to the new one, and delete the old account:

```sql
\set ON_ERROR_STOP on
BEGIN;
SELECT id AS old_id FROM app_users WHERE username = '<old username>' \gset
SELECT id AS new_id FROM app_users WHERE username = '<new username>' \gset

UPDATE pellet_entries    SET user_id = :new_id WHERE user_id = :old_id;
UPDATE pellet_deliveries SET user_id = :new_id WHERE user_id = :old_id;
UPDATE app_users SET weather_station_id = (SELECT weather_station_id FROM app_users WHERE id = :old_id),
                     role = (SELECT role FROM app_users WHERE id = :old_id)
WHERE id = :new_id;

DELETE FROM app_users WHERE id = :old_id;
COMMIT;
```

Run it like the import, through `docker compose exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'`. If the new account already has an entry on a date the old one also has, the unique constraint stops it and nothing changes. Remove `APP_BOOTSTRAP_*` from the server's `.env` afterwards.

## Tests

```sh
./gradlew test
```

- `PelletControllerTest` and `DeliveryControllerTest` are plain unit tests with mocked repositories.
- `SessionAuthTest` runs the real security filter chain with MockMvc: password login, sessions, CSRF, logout and that a deleted user is logged out.
- `GitHubLoginTest` runs the same chain with GitHub configured: the redirect to GitHub, failed logins and that password login is off. `GitHubAccountServiceTest` covers creating and finding accounts for GitHub logins.
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

The server keeps its own `.env` next to `compose.yaml`, with the GitHub OAuth app's keys and without `PASSWORD_LOGIN_ENABLED` and `APP_BOOTSTRAP_*`. The app listens on `127.0.0.1:8081` only and is reached from the internet through a Cloudflare Tunnel, which also handles HTTPS.

The image does not build the frontend; it uses the committed build in `src/main/resources/static/`.

## Ideas for later

- Stock counts, so the balance can be corrected against what is actually in the store.
- Price per delivery, for the cost per heating season.
- Comparison between heating seasons (kg, degree days and kg per degree day).
- Stock forecast based on the weather forecast.
- "Delete my account", and user administration.
- More login providers (e.g. Google).
- Convert `ApiClient.js` to TypeScript, lint `.ts`/`.tsx` files and add frontend tests.

## License

MIT
