# Finance Tracker

Static frontend with a Java Spring Boot API and MySQL.

## Run MySQL

Create a user that matches `backend/src/main/resources/application.properties` (default `root` / `root`), or set:

- `MYSQL_USER`
- `MYSQL_PASSWORD`

The app creates the `finance_tracker` database on startup if the MySQL user is allowed to.

## Run the backend

You need **Java 17+**. Maven is included as a wrapper.

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

API base URL: `http://localhost:8080/api`

## Run the frontend

Open `index.html` with Live Server (or any static file server). Sign up, then log in. The dashboard talks to Spring Boot with a JWT stored in `localStorage`.

## Main API routes

| Method | Path | Auth |
| --- | --- | --- |
| POST | `/api/auth/signup` | no |
| POST | `/api/auth/login` | no |
| GET | `/api/auth/me` | yes |
| GET/POST/PUT/DELETE | `/api/transactions` | yes |
| GET/POST/PUT/DELETE | `/api/budgets` | yes |
| GET/POST/PUT/DELETE | `/api/goals` | yes |
| PUT | `/api/users/me` | yes |
| PUT | `/api/users/me/password` | yes |
| PUT | `/api/users/me/prefs` | yes |
| DELETE | `/api/users/me/data` | yes |
