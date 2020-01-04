import { KinesisCurrencies } from '@abx-types/reference-data'

export interface WithdrawalKinesisCoinEmission {
  id?: number
  currency: KinesisCurrencies
  sequence: string
  txEnvelope: string
  withdrawalRequestId: number
}
