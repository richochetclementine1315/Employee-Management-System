from datetime import date

from sqlalchemy import select

from . import models  # noqa: F401
from .database import Base, SessionLocal, engine
from .models import Employee, Leave, LeaveStatus


EMPLOYEES = [
    {
        "employee_code": "EMP001",
        "name": "Aarav Sharma",
        "department": "Engineering",
        "skills": ["Python", "FastAPI", "PostgreSQL"],
        "date_of_appointment": date(2022, 3, 14),
    },
    {
        "employee_code": "EMP002",
        "name": "Maya Patel",
        "department": "Design",
        "skills": ["Figma", "UX Research", "Prototyping"],
        "date_of_appointment": date(2023, 1, 9),
    },
    {
        "employee_code": "EMP003",
        "name": "Rohan Mehta",
        "department": "Engineering",
        "skills": ["React", "TypeScript", "Accessibility"],
        "date_of_appointment": date(2021, 8, 23),
    },
    {
        "employee_code": "EMP004",
        "name": "Ishita Roy",
        "department": "Human Resources",
        "skills": ["Recruiting", "Onboarding", "People Operations"],
        "date_of_appointment": date(2022, 6, 1),
    },
    {
        "employee_code": "EMP005",
        "name": "Kabir Nair",
        "department": "Marketing",
        "skills": ["Content Strategy", "SEO", "Analytics"],
        "date_of_appointment": date(2024, 2, 12),
    },
    {
        "employee_code": "EMP006",
        "name": "Ananya Iyer",
        "department": "Finance",
        "skills": ["Financial Planning", "Excel", "Forecasting"],
        "date_of_appointment": date(2020, 11, 16),
    },
    {
        "employee_code": "EMP007",
        "name": "Vihaan Kapoor",
        "department": "Sales",
        "skills": ["Account Management", "Negotiation", "CRM"],
        "date_of_appointment": date(2023, 7, 3),
    },
    {
        "employee_code": "EMP008",
        "name": "Sara Thomas",
        "department": "Engineering",
        "skills": ["DevOps", "Docker", "AWS"],
        "date_of_appointment": date(2022, 10, 10),
    },
    {
        "employee_code": "EMP009",
        "name": "Arjun Bose",
        "department": "Customer Success",
        "skills": ["Client Relations", "Documentation", "Training"],
        "date_of_appointment": date(2024, 5, 20),
    },
    {
        "employee_code": "EMP010",
        "name": "Nisha Verma",
        "department": "Design",
        "skills": ["Illustration", "Brand Design", "Motion"],
        "date_of_appointment": date(2025, 1, 6),
    },
]

LEAVES = [
    ("EMP001", date(2026, 11, 16), date(2026, 11, 18), "Family function", LeaveStatus.approved),
    ("EMP002", date(2026, 12, 2), date(2026, 12, 4), "Personal time off", LeaveStatus.pending),
    ("EMP003", date(2026, 11, 23), date(2026, 11, 24), "Medical appointment", LeaveStatus.pending),
    ("EMP004", date(2026, 11, 10), date(2026, 11, 11), "Personal leave", LeaveStatus.approved),
    ("EMP005", date(2026, 12, 21), date(2026, 12, 31), "Year-end vacation", LeaveStatus.pending),
    ("EMP006", date(2026, 10, 5), date(2026, 10, 6), "Home renovation", LeaveStatus.rejected),
    ("EMP007", date(2026, 11, 30), date(2026, 12, 1), "Travel", LeaveStatus.pending),
    ("EMP008", date(2026, 11, 12), date(2026, 11, 13), "Conference attendance", LeaveStatus.approved),
    ("EMP009", date(2026, 12, 7), date(2026, 12, 9), "Family visit", LeaveStatus.pending),
]


def seed_database() -> tuple[int, int]:
    Base.metadata.create_all(bind=engine)
    added_employees = 0
    added_leaves = 0

    with SessionLocal() as db:
        employee_ids: dict[str, int] = {}
        for employee_data in EMPLOYEES:
            employee = db.scalar(
                select(Employee).where(Employee.employee_code == employee_data["employee_code"])
            )
            if employee is None:
                employee = Employee(**employee_data)
                db.add(employee)
                db.flush()
                added_employees += 1
            employee_ids[employee.employee_code] = employee.id

        for employee_code, start_date, end_date, purpose, status in LEAVES:
            employee_id = employee_ids[employee_code]
            existing_leave = db.scalar(
                select(Leave).where(
                    Leave.employee_id == employee_id,
                    Leave.start_date == start_date,
                    Leave.end_date == end_date,
                    Leave.purpose == purpose,
                )
            )
            if existing_leave is None:
                db.add(
                    Leave(
                        employee_id=employee_id,
                        start_date=start_date,
                        end_date=end_date,
                        purpose=purpose,
                        status=status,
                    )
                )
                added_leaves += 1

        db.commit()

    return added_employees, added_leaves


if __name__ == "__main__":
    employees_added, leaves_added = seed_database()
    print(f"Seed complete: added {employees_added} employees and {leaves_added} leave requests.")
