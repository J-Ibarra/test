import { AdminRequestType } from './enum'
import { CurrencyCode } from '@abx-types/reference-data'

export interface NewAdminRequestParams {
  hin: string
  type: AdminRequestType
  description?: string
  asset: CurrencyCode
  amount: number
  admin: string
  adminAccountId: string
  fee?: number
}
