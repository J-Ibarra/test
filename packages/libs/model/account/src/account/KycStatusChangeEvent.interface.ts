import { KycStatusChange } from './KycStatusChange.enum'

export interface KycStatusChangeEvent {
  accountId: string
  status: KycStatusChange
}
