from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Employee, Leave, LeaveStatus
from ..schemas import LeaveCreate, LeaveOut, LeaveStatusUpdate, LeaveUpdate

router = APIRouter(prefix="/leaves", tags=["Leaves"])


def _get_or_404(db: Session, leave_id: int) -> Leave:
    leave = db.get(Leave, leave_id)
    if not leave:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Leave not found")
    return leave


def _has_overlap(db: Session, employee_id: int, start: date, end: date, exclude_id: int | None = None) -> bool:
    stmt = select(Leave.id).where(
        Leave.employee_id == employee_id,
        Leave.status != LeaveStatus.rejected,
        Leave.start_date <= end,
        Leave.end_date >= start,
    )
    if exclude_id is not None:
        stmt = stmt.where(Leave.id != exclude_id)
    return db.scalars(stmt.limit(1)).first() is not None


def _validate_dates(db: Session, emp: Employee, start: date, end: date, exclude_id: int | None = None):
    if end < start:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, "end_date cannot be before start_date")
    if start < emp.date_of_appointment:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Leave cannot start before the date of appointment")
    if _has_overlap(db, emp.id, start, end, exclude_id):
        raise HTTPException(status.HTTP_409_CONFLICT, "Overlaps with an existing leave for this employee")


@router.post("", response_model=LeaveOut, status_code=status.HTTP_201_CREATED)
def create_leave(payload: LeaveCreate, db: Session = Depends(get_db)):
    emp = db.get(Employee, payload.employee_id)
    if not emp:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Employee not found")
    _validate_dates(db, emp, payload.start_date, payload.end_date)
    leave = Leave(**payload.model_dump())
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave


@router.get("", response_model=list[LeaveOut])
def list_leaves(
    employee_id: int | None = None,
    status_: LeaveStatus | None = Query(None, alias="status"),
    from_date: date | None = Query(None, description="Leaves ending on/after this date"),
    to_date: date | None = Query(None, description="Leaves starting on/before this date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    stmt = select(Leave)
    if employee_id is not None:
        stmt = stmt.where(Leave.employee_id == employee_id)
    if status_ is not None:
        stmt = stmt.where(Leave.status == status_)
    if from_date is not None:
        stmt = stmt.where(Leave.end_date >= from_date)
    if to_date is not None:
        stmt = stmt.where(Leave.start_date <= to_date)
    stmt = stmt.order_by(Leave.start_date.desc()).offset(skip).limit(limit)
    return db.scalars(stmt).all()


@router.get("/{leave_id}", response_model=LeaveOut)
def get_leave(leave_id: int, db: Session = Depends(get_db)):
    return _get_or_404(db, leave_id)


@router.patch("/{leave_id}", response_model=LeaveOut)
def update_leave(leave_id: int, payload: LeaveUpdate, db: Session = Depends(get_db)):
    leave = _get_or_404(db, leave_id)
    if leave.status != LeaveStatus.pending:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only pending leaves can be edited")
    data = payload.model_dump(exclude_unset=True, exclude_none=True)
    start = data.get("start_date", leave.start_date)
    end = data.get("end_date", leave.end_date)
    _validate_dates(db, leave.employee, start, end, exclude_id=leave.id)
    for key, value in data.items():
        setattr(leave, key, value)
    db.commit()
    db.refresh(leave)
    return leave


@router.patch("/{leave_id}/status", response_model=LeaveOut)
def update_leave_status(leave_id: int, payload: LeaveStatusUpdate, db: Session = Depends(get_db)):
    leave = _get_or_404(db, leave_id)
    leave.status = payload.status
    db.commit()
    db.refresh(leave)
    return leave


@router.delete("/{leave_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_leave(leave_id: int, db: Session = Depends(get_db)):
    leave = _get_or_404(db, leave_id)
    db.delete(leave)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
