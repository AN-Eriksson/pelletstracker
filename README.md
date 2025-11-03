# PelletTracker

Status: In progress (work in progress)

PelletTracker is a small application to record and visualize household pellet consumption over time. The app collects usage entries and presents charts to help monitor consumption trends and plan deliveries.

## Key features
- Record pellet usage entries (date, quantity).
- Time-series charts and summaries.

## Coming functionality / To be implemented
- Frontend:
    - Frontend converted to React; improve chart UI.
    - Convert JavaScript code to TypeScript.
    - User account pages and preferences.
- Backend:
    - Authentication and authorization (JWT-based access tokens, role-based access).
    - Validation, better error responses and global exception handling.
    - Pagination and filtering for large data sets.
    - Import/Export improvements (bulk import, CSV mapping).
    - Rate limiting and basic abuse protection.
    - Migrate to PostgresSQL-database.
- Tests:
    - Add comprehensive unit and integration tests for backend and frontend.
    - End-to-end tests for critical flows.

## Tech stack
- Backend: Java, Spring Boot
- Frontend: React
- Build: Gradle
- Database: MongoDB
- Containerization: Docker
- CI\/CD: GitHub Actions (builds containers and deploys)

## Running locally
- Backend: run with Gradle (`./gradlew bootRun`) or build a Docker image.
- Database: start a MongoDB instance (or use the provided Docker Compose).
- Frontend: install with npm and run the dev server.

Environment variables and ports are configured in the project for local dev and for production in GitHub Secrets.

## Development notes
- Backend API under `/api/pellets`.
- Tests and CI workflows are configured in the `.github/workflows` directory.

## CI\/CD
GitHub Actions builds container images and deploys the service via the repository CI\/CD pipeline.

## Contributing
Contributions and bug reports are welcome. Open an issue or submit a pull request.

## License
MIT