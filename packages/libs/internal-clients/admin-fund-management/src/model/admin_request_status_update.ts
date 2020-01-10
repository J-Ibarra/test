import { AdminRequestStatus } from './enum'

export interface AdminRequestStatusUpdate {
  id: number
  adminId: string
  status: AdminRequestStatus
  approvedAt: Date
}


