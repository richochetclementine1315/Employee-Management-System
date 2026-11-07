import { apiClient } from './client'
import type { Leave, LeavePayload, LeaveStatus } from '../types/api'

export async function getLeaves(params?: {
  employee_id?: number
  status?: LeaveStatus
  from_date?: string
  to_date?: string
}) {
  const response = await apiClient.get<Leave[]>('/leaves', { params })
  return response.data
}

export async function getLeave(id: number) {
  const response = await apiClient.get<Leave>(`/leaves/${id}`)
  return response.data
}

export async function createLeave(payload: LeavePayload) {
  const response = await apiClient.post<Leave>('/leaves', payload)
  return response.data
}

export async function updateLeave(id: number, payload: Partial<Omit<LeavePayload, 'employee_id'>>) {
  const response = await apiClient.patch<Leave>(`/leaves/${id}`, payload)
  return response.data
}

export async function updateLeaveStatus(id: number, status: LeaveStatus) {
  const response = await apiClient.patch<Leave>(`/leaves/${id}/status`, { status })
  return response.data
}

export async function deleteLeave(id: number) {
  await apiClient.delete(`/leaves/${id}`)
}
