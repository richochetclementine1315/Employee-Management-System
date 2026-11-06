import enum
from datetime import date, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class LeaveStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)  # e.g. "EMP001"
    name: Mapped[str] = mapped_column(String(150))
    department: Mapped[str] = mapped_column(String(100), index=True)
    skills: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    date_of_appointment: Mapped[date] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    leaves: Mapped[list["Leave"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan", passive_deletes=True
    )


class Leave(Base):
    __tablename__ = "leaves"
    __table_args__ = (CheckConstraint("end_date >= start_date", name="ck_leave_dates"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), index=True
    )
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    purpose: Mapped[str] = mapped_column(Text)
    status: Mapped[LeaveStatus] = mapped_column(
        Enum(LeaveStatus, name="leave_status"), default=LeaveStatus.pending
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    employee: Mapped[Employee] = relationship(back_populates="leaves")
