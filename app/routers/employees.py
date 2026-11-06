from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Employee, Leave
from ..schemas import EmployeeCreate, EmployeeOut, EmployeeUpdate, LeaveOut

router = APIRouter(prefix="/employees", tags=["Employees"])


def _get_or_404(db: Session, employee_id: int) -> Employee:
    emp = db.get(Employee, employee_id)
    if not emp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found")
    return emp


def _code_taken(db: Session, code: str, exclude_id: int | None = None) -> bool:
    stmt = select(Employee.id).where(Employee.employee_code == code)
    if exclude_id is not None:
        stmt = stmt.where(Employee.id != exclude_id)
    return db.scalars(stmt.limit(1)).first() is not None


@router.post("", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    if _code_taken(db, payload.employee_code):
        raise HTTPException(status.HTTP_409_CONFLICT, "Employee ID already exists")
    emp = Employee(**payload.model_dump())
    db.add(emp)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, "Employee ID already exists")
    db.refresh(emp)
    return emp


@router.get("", response_model=list[EmployeeOut])
def list_employees(
    q: str | None = Query(None, description="Search by name or employee ID"),
    department: str | None = None,
    skill: str | None = Query(None, description="Exact skill match (case-sensitive)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = select(Employee)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(or_(Employee.name.ilike(like), Employee.employee_code.ilike(like)))
    if department:
        stmt = stmt.where(func.lower(Employee.department) == department.lower())
    if skill:
        stmt = stmt.where(Employee.skills.any(skill))
    stmt = stmt.order_by(Employee.id).offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, employee_id)


@router.patch("/{employee_id}", response_model=EmployeeOut)
def update_employee(employee_id: int, payload: EmployeeUpdate, db: Session = Depends(get_db)):
    emp = _get_or_404(db, employee_id)
    data = payload.model_dump(exclude_unset=True)
    if "employee_code" in data and _code_taken(db, data["employee_code"], exclude_id=emp.id):
        raise HTTPException(status.HTTP_409_CONFLICT, "Employee ID already exists")
    for key, value in data.items():
        if value is None and key != "skills":
            continue  # don't null out required columns
        setattr(emp, key, value if value is not None else [])
    db.commit()
    db.refresh(emp)
    return emp


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = _get_or_404(db, employee_id)
    db.delete(emp)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{employee_id}/leaves", response_model=list[LeaveOut])
def list_employee_leaves(employee_id: int, db: Session = Depends(get_db)):
    _get_or_404(db, employee_id)
    stmt = select(Leave).where(Leave.employee_id == employee_id).order_by(Leave.start_date.desc())
    return db.scalars(stmt).all()
