from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .models import LeaveStatus


def _clean_skills(skills: list[str] | None) -> list[str] | None:
    if skills is None:
        return None
    seen, cleaned = set(), []
    for s in skills:
        s = s.strip()
        if s and s.lower() not in seen:
            seen.add(s.lower())
            cleaned.append(s)
    return cleaned


# ---------- Employees ----------
class EmployeeBase(BaseModel):
    employee_code: str = Field(min_length=1, max_length=50, examples=["EMP001"])
    name: str = Field(min_length=1, max_length=150)
    department: str = Field(min_length=1, max_length=100)
    skills: list[str] = Field(default_factory=list, examples=[["Python", "FastAPI"]])
    date_of_appointment: date

    @field_validator("skills")
    @classmethod
    def clean_skills(cls, v):
        return _clean_skills(v)


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    employee_code: str | None = Field(default=None, min_length=1, max_length=50)
    name: str | None = Field(default=None, min_length=1, max_length=150)
    department: str | None = Field(default=None, min_length=1, max_length=100)
    skills: list[str] | None = None
    date_of_appointment: date | None = None

    @field_validator("skills")
    @classmethod
    def clean_skills(cls, v):
        return _clean_skills(v)


class EmployeeOut(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------- Leaves ----------
class LeaveBase(BaseModel):
    start_date: date
    end_date: date
    purpose: str = Field(min_length=1, max_length=1000)

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date < self.start_date:
            raise ValueError("end_date cannot be before start_date")
        return self


class LeaveCreate(LeaveBase):
    employee_id: int


class LeaveUpdate(BaseModel):
    start_date: date | None = None
    end_date: date | None = None
    purpose: str | None = Field(default=None, min_length=1, max_length=1000)


class LeaveStatusUpdate(BaseModel):
    status: LeaveStatus


class LeaveOut(LeaveBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_id: int
    status: LeaveStatus
    created_at: datetime
