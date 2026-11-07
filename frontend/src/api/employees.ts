import { apiClient } from './client'
import type { Employee, EmployeePayload, Leave } from '../types/api'

export async function getEmployees(params?: { q?: string; department?: string; skill?: string }) {
  const response = await apiClient.get<Employee[]>('/employees', { params })
  return response.data
}

export async function getEmployee(id: number) {
  const response = await apiClient.get<Employee>(`/employees/${id}`)
  return response.data
}

export async function createEmployee(payload: EmployeePayload) {
  const response = await apiClient.post<Employee>('/employees', payload)
  return response.data
}

export async function updateEmployee(id: number, payload: Partial<EmployeePayload>) {
  const response = await apiClient.patch<Employee>(`/employees/${id}`, payload)
  return response.data
}

export async function deleteEmployee(id: number) {
  await apiClient.delete(`/employees/${id}`)
}

export async function getEmployeeLeaves(id: number) {
  const response = await apiClient.get<Leave[]>(`/employees/${id}/leaves`)
  return response.data
}
