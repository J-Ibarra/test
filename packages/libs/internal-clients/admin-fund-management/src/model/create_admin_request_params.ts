import { AdminRequestType, AdminRequestStatus } from './enum'
import { CurrencyCode } from '@abx-types/reference-data'

export interface CreateAdminRequestParams {
  client: string
  hin: string
  type: AdminRequestType
  description?: string
  asset: CurrencyCode
  amount: number
  admin: string
  status: AdminRequestStatus
  fee?: number
}

