export type Employee = {
  id: number
  employee_code: string
  name: string
  department: string
  skills: string[]
  date_of_appointment: string
  created_at: string
}

export type EmployeePayload = Omit<Employee, 'id' | 'created_at'>
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export type Leave = {
  id: number
  employee_id: number
  start_date: string
  end_date: string
  purpose: string
  status: LeaveStatus
  created_at: string
}

export type LeavePayload = {
  employee_id: number
  start_date: string
  end_date: string
  purpose: string
}
