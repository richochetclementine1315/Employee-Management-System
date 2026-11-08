# Employee Management System

A full-stack employee and leave management system with a FastAPI backend, a React dashboard, and PostgreSQL persistence.

The application provides a focused workspace for maintaining employee records and reviewing leave requests, with validation rules that protect data integrity across both the API and user interface.

## Features

- Employee directory with search by name or employee ID
- Filtering by department and skill
- Create, edit, and delete employee records
- Employee profile view with appointment date and skills
- Leave request creation and management
- Pending, approved, and rejected leave statuses
- Leave filtering by employee, status, and date range
- Validation for duplicate employee IDs, invalid date ranges, leave overlaps, and leave dates before appointment
- Interactive API documentation through FastAPI
- PostgreSQL database managed locally with Docker Compose

## Technology Stack

### Backend

- Python 3.12+
- FastAPI
- SQLAlchemy 2
- Pydantic Settings
- PostgreSQL
- Uvicorn

### Frontend

- React 19
- TypeScript
- Vite
- TanStack React Query
- Axios
- React Router
- Lucide React

## Project Structure

```text
.
├── app/
│   ├── main.py              # FastAPI application and middleware
│   ├── config.py            # Environment-backed settings
│   ├── database.py          # SQLAlchemy engine and sessions
│   ├── models.py            # Employee and leave database models
│   ├── schemas.py           # Request and response validation
│   ├── seed.py              # Demo data loader
│   └── routers/             # Employee and leave endpoints
├── frontend/
│   ├── src/
│   │   ├── api/             # Typed API clients
│   │   ├── types/           # Shared frontend API types
│   │   └── App.tsx          # Dashboard UI
│   └── package.json
├── docker-compose.yml       # Local PostgreSQL service
├── main.py                  # Backend entry-point placeholder
├── pyproject.toml
└── .env.example
```

## Prerequisites

Install the following before starting:

- Python 3.12 or newer
- Node.js 20 or newer with npm
- Docker Desktop

## Quick Start

### 1. Start PostgreSQL

From the repository root:

```powershell
docker compose up -d db
```

This starts PostgreSQL on `localhost:5432` with the following local development credentials:

| Setting | Value |
|---|---|
| Database | `employee_db` |
| Username | `postgres` |
| Password | `postgres` |
| Port | `5432` |

### 2. Configure the backend

Create a `.env` file in the repository root:

```powershell
Copy-Item .env.example .env
```

Set `DATABASE_URL` to a valid SQLAlchemy PostgreSQL URL:

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/employee_db
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]
```

### 3. Install backend dependencies

Using the included virtual environment:

```powershell
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Alternatively, install from the project metadata with your preferred Python environment:

```powershell
python -m pip install -e .
```

### 4. Start the API

```powershell
python -m uvicorn app.main:app --reload
```

The API is available at [http://localhost:8000](http://localhost:8000).

Interactive documentation:

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- Health check: [http://localhost:8000/health](http://localhost:8000/health)

### 5. Load demo data (optional)

In a second terminal, from the repository root:

```powershell
.\venv\Scripts\Activate.ps1
python -m app.seed
```

The seed operation is idempotent and adds the sample employees and leave requests only when they do not already exist.

### 6. Start the frontend

In a second terminal:

```powershell
Set-Location frontend
npm install
npm run dev
```

Open the URL printed by Vite, normally [http://localhost:5173](http://localhost:5173).

The frontend reads the backend URL from `VITE_API_URL`. For a local API, create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:8000
```

If `VITE_API_URL` is not set, Axios receives an empty base URL and uses the current browser origin, so the frontend should normally be configured explicitly when running Vite locally.

## API Overview

All endpoints return JSON unless otherwise noted.

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Check API availability |

### Employees

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/employees` | List employees with optional search and filters |
| `POST` | `/employees` | Create an employee |
| `GET` | `/employees/{employee_id}` | Get one employee |
| `PATCH` | `/employees/{employee_id}` | Update an employee |
| `DELETE` | `/employees/{employee_id}` | Delete an employee |
| `GET` | `/employees/{employee_id}/leaves` | List an employee's leave requests |

Supported list filters include `q`, `department`, `skill`, `skip`, and `limit`.

### Leave Requests

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/leaves` | List leave requests with optional filters |
| `POST` | `/leaves` | Create a leave request |
| `GET` | `/leaves/{leave_id}` | Get one leave request |
| `PATCH` | `/leaves/{leave_id}` | Edit a pending leave request |
| `PATCH` | `/leaves/{leave_id}/status` | Change leave status |
| `DELETE` | `/leaves/{leave_id}` | Delete a leave request |

Leave list filters include `employee_id`, `status`, `from_date`, `to_date`, `skip`, and `limit`.

## Development Commands

Run these commands from `frontend/`:

```powershell
npm run dev       # Start the Vite development server
npm run build     # Type-check and create a production build
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

Run the backend from the repository root:

```powershell
python -m uvicorn app.main:app --reload
```

## Data and Validation Notes

- Database tables are created automatically when the API starts.
- Employee IDs (`employee_code`) must be unique.
- Employee skills are trimmed and de-duplicated case-insensitively.
- Leave end dates cannot precede start dates.
- A leave request cannot begin before the employee's appointment date.
- Non-rejected leave requests cannot overlap for the same employee.
- Only pending leave requests can be edited; their status can be changed separately.
- Deleting an employee cascades to that employee's leave requests.

## Stopping Local Services

Stop the PostgreSQL container while preserving its data volume:

```powershell
docker compose stop db
```

Stop it and remove the container:

```powershell
docker compose down
```

To also remove the local database volume and all stored data:

```powershell
docker compose down -v
```

## License

This project is licensed under the [MIT License](LICENSE).